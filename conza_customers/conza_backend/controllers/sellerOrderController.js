// conzacsb/controllers/sellerOrderController.js
const mongoose    = require('mongoose');
const SellerOrder = require('../models/SellerOrder');
const Product     = require('../models/Product');
const Seller      = require('../models/Seller');
const { getIO }   = require('../services/socketService');
const { withCache, invalidateCache } = require('../utils/cacheHelpers');
const logger      = require('../utils/logger');
const {
  calculateMaterialOrderPricing,
  calculateRentalOrderPricing,
} = require('../services/orderPricingService');

const sendSellerPush = async (pushToken, title, body, data = {}) => {
  if (!pushToken) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: pushToken, title, body, data, sound: 'default', priority: 'high' }),
    });
  } catch (_) {}
};

// ── CUSTOMER: POST /api/orders/seller/preview ─────────────────────────────
// Exposes authoritative server pricing before final order submission
const previewOrderPricing = async (req, res) => {
  try {
    const { sellerId, orderType, items, durationDays } = req.body;

    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing sellerId' });
    }
    if (!['material', 'rental'].includes(orderType)) {
      return res.status(400).json({ success: false, message: 'Invalid orderType: must be material or rental' });
    }
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'Items array cannot be empty' });
    }

    const pricing = orderType === 'material'
      ? await calculateMaterialOrderPricing(items, sellerId)
      : await calculateRentalOrderPricing(items, sellerId, durationDays);

    res.json({
      success: true,
      pricing: {
        orderType,
        items: pricing.snapshotItems,
        subtotal: pricing.subtotal,
        deliveryCharge: pricing.deliveryCharge,
        depositAmount: pricing.depositAmount,
        total: pricing.total,
      },
    });
  } catch (err) {
    logger.warn({ err: err.message }, 'previewOrderPricing failed');
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── CUSTOMER: POST /api/orders/seller ──────────────────────────────────────
const placeOrder = async (req, res) => {
  let session = null;
  try {
    const {
      sellerId, orderType, items,
      customerAddress, city, pincode, latitude, longitude,
      startDate, endDate, durationDays,
      paymentMethod, notes,
    } = req.body;

    const idempotencyKey = (
      req.headers['idempotency-key'] ||
      req.headers['x-idempotency-key'] ||
      req.body.idempotencyKey ||
      null
    );

    const user = req.user;

    // ── 1. Idempotency Check ────────────────────────────────────────────────
    if (idempotencyKey) {
      const existingOrder = await SellerOrder.findOne({
        customer: user._id,
        idempotencyKey,
      }).populate('seller', 'pushToken shopName').lean();

      if (existingOrder) {
        logger.info({ orderId: existingOrder._id, idempotencyKey }, 'Returning idempotent replayed order');
        return res.status(200).json({
          success: true,
          order: existingOrder,
          idempotentReplay: true,
        });
      }
    }

    // ── 2. Basic Validation ─────────────────────────────────────────────────
    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing sellerId' });
    }
    if (!['material', 'rental'].includes(orderType)) {
      return res.status(400).json({ success: false, message: 'Invalid orderType: must be material or rental' });
    }
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'Items array cannot be empty' });
    }

    // ── 3. Start Multi-Document MongoDB Transaction ──────────────────────────
    session = await mongoose.startSession();
    session.startTransaction();

    let pricing;
    let parsedStart = null;
    let parsedEnd = null;
    let cleanDurationDays = null;

    if (orderType === 'material') {
      // 3A. Authoritative Server Pricing (ignores any client subtotal/total/fees)
      pricing = await calculateMaterialOrderPricing(items, sellerId, session);

      // 3B. Atomic Conditional Stock Deduction for Materials
      for (const item of pricing.snapshotItems) {
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.product,
            seller: sellerId,
            stock: { $gte: item.qty },
            isAvailable: true,
            type: 'material',
          },
          {
            $inc: { stock: -item.qty, sold: item.qty },
          },
          { session, new: true }
        );

        if (!updatedProduct) {
          // Find product to give clear diagnostic message
          const currentP = await Product.findById(item.product).session(session).lean();
          const availStock = currentP ? currentP.stock : 0;
          throw new Error(
            `Insufficient stock for "${item.title}". Requested: ${item.qty}, Available: ${availStock}`
          );
        }
      }
    } else {
      // 3C. Rental Order Flow
      cleanDurationDays = Math.max(parseInt(durationDays, 10) || 1, 1);
      parsedStart = startDate ? new Date(startDate) : new Date();
      parsedEnd = endDate ? new Date(endDate) : new Date(parsedStart.getTime() + cleanDurationDays * 86400000);

      if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime()) || parsedEnd < parsedStart) {
        throw new Error('Invalid rental date range');
      }

      pricing = await calculateRentalOrderPricing(items, sellerId, cleanDurationDays, session);

      // 3D. Rental Overlapping Date & Capacity Validation
      for (const item of pricing.snapshotItems) {
        const product = await Product.findOne({
          _id: item.product,
          seller: sellerId,
          isAvailable: true,
          type: 'rental',
        }).session(session).lean();

        if (!product) {
          throw new Error(`Rental product "${item.title}" not found or unavailable`);
        }

        if (product.stock < item.qty) {
          throw new Error(
            `Insufficient total units for equipment "${item.title}". Requested: ${item.qty}, Total owned: ${product.stock}`
          );
        }

        // Query overlapping active reservations
        const overlappingOrders = await SellerOrder.find({
          'items.product': item.product,
          orderType: 'rental',
          status: { $in: ['new', 'accepted', 'active', 'overdue'] },
          startDate: { $lte: parsedEnd },
          endDate:   { $gte: parsedStart },
        }).session(session).lean();

        const bookedUnits = overlappingOrders.reduce((sum, ord) => {
          const matchingItem = (ord.items || []).find(
            (it) => it.product?.toString() === item.product.toString()
          );
          return sum + (matchingItem?.qty || 0);
        }, 0);

        const availableUnits = product.stock - bookedUnits;
        if (availableUnits < item.qty) {
          throw new Error(
            `Equipment "${item.title}" is fully booked for selected dates. Available: ${Math.max(0, availableUnits)}, Requested: ${item.qty}`
          );
        }
      }
    }

    // ── 4. Create Order with Immutable Financial Snapshot ────────────────────
    const [order] = await SellerOrder.create(
      [
        {
          seller:          sellerId,
          customer:        user._id,
          orderType,
          items:           pricing.snapshotItems,
          customerName:    user.fullName || '',
          customerPhone:   user.phone || '',
          customerAddress: customerAddress || '',
          city:            city || '',
          pincode:         pincode || '',
          latitude:        latitude  || null,
          longitude:       longitude || null,
          startDate:       orderType === 'rental' ? parsedStart : null,
          endDate:         orderType === 'rental' ? parsedEnd   : null,
          durationDays:    orderType === 'rental' ? cleanDurationDays : null,
          subtotal:        pricing.subtotal,
          deliveryCharge:  pricing.deliveryCharge,
          total:           pricing.total,
          depositAmount:   pricing.depositAmount,
          depositStatus:   pricing.depositAmount > 0 ? 'pending' : undefined,
          paymentMethod:   paymentMethod || 'cod',
          notes:           notes || '',
          idempotencyKey,
          stockRestored:   false,
        },
      ],
      { session }
    );

    // ── 5. Commit Transaction ───────────────────────────────────────────────
    await session.commitTransaction();
    session.endSession();
    session = null;

    // ── 6. Post-Commit Actions: Cache Invalidation & Real-Time Events ─────────
    await order.populate('seller', 'pushToken shopName');

    // Bust seller dashboard and product list caches
    invalidateCache(
      `dashboard:seller:${sellerId}`,
      `products:seller:${sellerId}:*`
    ).catch(() => {});

    try {
      const io = getIO();
      io.to(`seller_${sellerId}`).emit('new_seller_order', {
        orderId: order._id,
        orderType,
        customerName: user.fullName,
        total: order.total,
      });
    } catch (_) {}

    sendSellerPush(
      order.seller?.pushToken,
      '🛒 New Order Received',
      `${user.fullName} placed an order · ₹${order.total}`,
      { orderId: order._id.toString() }
    ).catch(() => {});

    return res.status(201).json({ success: true, order });
  } catch (err) {
    if (session && session.inTransaction()) {
      await session.abortTransaction().catch(() => {});
    }
    if (session) {
      session.endSession().catch(() => {});
    }

    logger.error({ err: err.message }, 'placeOrder failed');
    const isClientError =
      err.name === 'ValidationError' ||
      err.name === 'CastError' ||
      err.message?.includes('not found') ||
      err.message?.includes('Insufficient stock') ||
      err.message?.includes('fully booked') ||
      err.message?.includes('Invalid') ||
      err.message?.includes('Minimum');

    res.status(isClientError ? 400 : 500).json({ success: false, message: err.message });
  }
};

// ── SELLER: GET /api/seller/orders ────────────────────────────────────────
const getSellerOrders = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = { seller: req.seller._id };
    if (status && status !== 'all') query.status = status;
    if (type)   query.orderType = type;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      SellerOrder.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      SellerOrder.countDocuments(query),
    ]);

    res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── SELLER: GET /api/seller/orders/:id ───────────────────────────────────
const getOrderById = async (req, res) => {
  try {
    const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.seller._id }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── SELLER: PATCH /api/seller/orders/:id/status ──────────────────────────
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'status required' });

    const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.seller._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const prevStatus = order.status;
    order.status = status;

    // ── Stock Restoration on Cancellation or Return ─────────────────────────
    // Prevent double-restoration using the atomic stockRestored guard flag
    if ((status === 'returned' || status === 'cancelled') && !order.stockRestored) {
      if (order.orderType === 'material') {
        for (const item of order.items) {
          if (item.product) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: item.qty, sold: -item.qty },
            });
          }
        }
      }
      order.stockRestored = true;
      if (status === 'returned') {
        order.depositStatus = 'refunded';
      }
    }

    await order.save();

    // Invalidate caches
    invalidateCache(
      `dashboard:seller:${req.seller._id}`,
      `products:seller:${req.seller._id}:*`
    ).catch(() => {});

    const io = getIO();
    const itemsSummary =
      order.items && order.items.length
        ? order.items.length === 1
          ? order.items[0].title
          : `${order.items[0].title} +${order.items.length - 1} more`
        : '';

    io.to(`seller_${req.seller._id}`).emit('order_status_updated', { orderId: order._id, status, prevStatus });
    io.to(`customer_${order.customer}`).emit('seller_order_status_changed', {
      orderId: order._id,
      status,
      orderType: order.orderType,
      itemsSummary,
      total: order.total,
    });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── SELLER: GET /api/seller/dashboard ────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const sellerId = req.seller._id;
    const cacheKey = `dashboard:seller:${sellerId}`;
    const TTL      = 60; // 60s — fresh enough, saves 11 DB calls per open

    const data = await withCache(cacheKey, TTL, async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [
        totalProducts,
        totalOrders,
        newOrders,
        activeRentals,
        lowStockCount,
        revenueAgg,
        monthRevenueAgg,
        lastMonthRevenueAgg,
        recentMaterialOrders,
        recentRentalOrders,
        chartData,
      ] = await Promise.all([
        Product.countDocuments({ seller: sellerId }),
        SellerOrder.countDocuments({ seller: sellerId }),
        SellerOrder.countDocuments({ seller: sellerId, status: 'new' }),
        SellerOrder.countDocuments({ seller: sellerId, orderType: 'rental', status: 'active' }),
        Product.countDocuments({ seller: sellerId, $expr: { $lte: ['$stock', '$lowStockAt'] } }),
        SellerOrder.aggregate([
          { $match: { seller: sellerId, status: { $in: ['delivered', 'returned'] } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        SellerOrder.aggregate([
          { $match: { seller: sellerId, status: { $in: ['delivered', 'returned'] }, createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        SellerOrder.aggregate([
          {
            $match: {
              seller: sellerId,
              status: { $in: ['delivered', 'returned'] },
              createdAt: {
                $gte: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() - 1, 1),
                $lt:  startOfMonth,
              },
            },
          },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        SellerOrder.find({ seller: sellerId, orderType: 'material' }).sort({ createdAt: -1 }).limit(5).lean(),
        SellerOrder.find({ seller: sellerId, orderType: 'rental'   }).sort({ createdAt: -1 }).limit(5).lean(),
        SellerOrder.aggregate([
          {
            $match: {
              seller: sellerId,
              status: { $in: ['delivered', 'returned'] },
              createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
          },
          {
            $group: {
              _id:   { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              total: { $sum: '$total' },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      const revenue      = revenueAgg[0]?.total          || 0;
      const monthRevenue = monthRevenueAgg[0]?.total      || 0;
      const lastMonth    = lastMonthRevenueAgg[0]?.total  || 0;
      const growth = lastMonth > 0
        ? `${monthRevenue >= lastMonth ? '+' : ''}${Math.round(((monthRevenue - lastMonth) / lastMonth) * 100)}%`
        : '+0%';

      return {
        kpi: {
          newOrders,
          activeRentals,
          totalProducts,
          lowStockItems: lowStockCount,
        },
        revenue,
        monthRevenue,
        growth,
        recentMaterialOrders,
        recentRentalOrders,
        chartData,
      };
    });

    res.json({
      success: true,
      kpi:     data.kpi,
      vendor: {
        name:          req.seller.name,
        shopName:      req.seller.shopName,
        walletBalance: req.seller.walletBalance,
        monthEarnings: data.monthRevenue,
        growth:        data.growth,
      },
      totalRevenue:         data.revenue,
      recentMaterialOrders: data.recentMaterialOrders,
      recentRentalOrders:   data.recentRentalOrders,
      chartData:            data.chartData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CUSTOMER: GET /api/orders/seller/my ──────────────────────────────────
const getMyOrders = async (req, res) => {
  try {
    const orders = await SellerOrder.find({ customer: req.user._id })
      .populate('seller', 'name shopName phone address city pincode profileImage isVerified')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CUSTOMER: GET /api/orders/seller/:id ─────────────────────────────────
const getCustomerOrderById = async (req, res) => {
  try {
    const order = await SellerOrder.findOne({ _id: req.params.id, customer: req.user._id })
      .populate('seller', 'name shopName phone address city pincode profileImage isVerified')
      .lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  previewOrderPricing,
  placeOrder,
  getSellerOrders,
  getOrderById,
  updateOrderStatus,
  getDashboard,
  getMyOrders,
  getCustomerOrderById,
};
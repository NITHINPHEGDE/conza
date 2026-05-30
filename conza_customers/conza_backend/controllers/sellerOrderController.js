// conzacsb/controllers/sellerOrderController.js
const SellerOrder = require('../models/SellerOrder');
const Product     = require('../models/Product');
const Seller      = require('../models/Seller');
const { getIO }   = require('../services/socketService');

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

// ── CUSTOMER: POST /api/orders/seller ──────────────────────────────────────
const placeOrder = async (req, res) => {
  try {
    const {
      sellerId, orderType, items,
      customerAddress, city, pincode, latitude, longitude,
      startDate, endDate, durationDays,
      subtotal, deliveryCharge, total, depositAmount,
      paymentMethod, notes,
    } = req.body;

    if (!sellerId || !orderType || !items?.length || !subtotal || !total) {
      return res.status(400).json({ success: false, message: 'Missing required order fields' });
    }

    const user = req.user;

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ success: false, message: `Invalid sellerId: ${sellerId}` });
    }

    // Validate all productIds are present before hitting the DB
    for (const item of items) {
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({ success: false, message: `Invalid or missing productId: ${item.productId}` });
      }
    }

    // Build item snapshots & decrement stock
    const snapshotItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        if (orderType === 'material' && product.stock < item.qty) {
          throw new Error(`Insufficient stock for ${product.title}`);
        }
        if (orderType === 'material') {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.qty, sold: item.qty } });
        }
        return {
          product:  product._id,
          title:    product.title,
          image:    product.images?.[0] || null,
          price:    product.price,
          unit:     product.unit,
          qty:      item.qty,
          days:     item.days || null,
          subtotal: item.subtotal,
        };
      })
    );

    const order = await SellerOrder.create({
      seller:          sellerId,
      customer:        user._id,
      orderType,
      items:           snapshotItems,
      customerName:    user.fullName,
      customerPhone:   user.phone,
      customerAddress: customerAddress || '',
      city:            city || '',
      pincode:         pincode || '',
      latitude:        latitude  || null,
      longitude:       longitude || null,
      startDate:       startDate  ? new Date(startDate)  : null,
      endDate:         endDate    ? new Date(endDate)     : null,
      durationDays:    durationDays || null,
      subtotal,
      deliveryCharge:  deliveryCharge || 0,
      total,
      depositAmount:   depositAmount  || 0,
      paymentMethod:   paymentMethod  || 'cod',
      notes:           notes || '',
    });

    await order.populate('seller', 'pushToken shopName');

    // Real-time: notify seller room (non-fatal — socket may not be connected)
    try {
      const io = getIO();
      io.to(`seller_${sellerId}`).emit('new_seller_order', {
        orderId: order._id,
        orderType,
        customerName: user.fullName,
        total,
      });
    } catch (_) {}

    // Push notification to seller (non-fatal)
    sendSellerPush(
      order.seller.pushToken,
      '🛒 New Order Received',
      `${user.fullName} placed an order · ₹${total}`,
      { orderId: order._id.toString() }
    ).catch(() => {});

    res.status(201).json({ success: true, order });
  } catch (err) {
    const fs = require('fs');
    fs.appendFileSync('error.log', `${new Date().toISOString()} - ${err.message}\n${err.stack}\n\n`);
    // Stock/validation/cast errors → 400, unexpected errors → 500
    const isClientError = 
      err.name === 'ValidationError' || 
      err.name === 'CastError' || 
      err.message?.includes('not found') || 
      err.message?.includes('Insufficient stock');
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
      SellerOrder.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
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
    const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.seller._id });
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

    order.status = status;

    // If rental returned, update product availability
    if (status === 'returned') {
      for (const item of order.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
        }
      }
    }

    await order.save();

    const io = getIO();
    io.to(`seller_${req.seller._id}`).emit('order_status_updated', { orderId: order._id, status });
    // Also notify customer's room
    io.to(`customer_${order.customer}`).emit('seller_order_status_changed', { orderId: order._id, status });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── SELLER: GET /api/seller/dashboard ────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const sellerId = req.seller._id;

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
      SellerOrder.find({ seller: sellerId, orderType: 'material' }).sort({ createdAt: -1 }).limit(5),
      SellerOrder.find({ seller: sellerId, orderType: 'rental'   }).sort({ createdAt: -1 }).limit(5),
      // 7-day revenue chart
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

    const revenue      = revenueAgg[0]?.total      || 0;
    const monthRevenue = monthRevenueAgg[0]?.total  || 0;
    const lastMonth    = lastMonthRevenueAgg[0]?.total || 0;
    const growth = lastMonth > 0
      ? `${monthRevenue >= lastMonth ? '+' : ''}${Math.round(((monthRevenue - lastMonth) / lastMonth) * 100)}%`
      : '+0%';

    res.json({
      success: true,
      kpi: {
        newOrders,
        activeRentals,
        totalProducts,
        lowStockItems: lowStockCount,
      },
      vendor: {
        name:          req.seller.name,
        shopName:      req.seller.shopName,
        walletBalance: req.seller.walletBalance,
        monthEarnings: monthRevenue,
        growth,
      },
      totalRevenue: revenue,
      recentMaterialOrders,
      recentRentalOrders,
      chartData,   // [{ _id: 'YYYY-MM-DD', total: number }]   // [{ _id: 'YYYY-MM-DD', total: number }]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CUSTOMER: GET /api/orders/seller/my ──────────────────────────────────
const getMyOrders = async (req, res) => {
  try {
    const orders = await SellerOrder.find({ customer: req.user._id })
      .populate('seller', 'name shopName phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  placeOrder, getSellerOrders, getOrderById,
  updateOrderStatus, getDashboard, getMyOrders,
};
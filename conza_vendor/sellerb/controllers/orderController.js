// conzasb/controllers/orderController.js
const SellerOrder = require('../models/SellerOrder');
const Product     = require('../models/Product');
const Seller      = require('../models/Seller');
const { getIO }   = require('../services/socketService');
const fetch       = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

// ── Push notification helper ──────────────────────────────────────────────────
const sendPush = async (pushToken, title, body, data = {}) => {
  if (!pushToken) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: pushToken, title, body, data,
        sound: 'default', priority: 'high',
      }),
    });
  } catch (_) {}
};

// ── POST /api/orders ──────────────────────────────────────────────────────────
// Called by the customer app to place a seller order
const placeOrder = async (req, res) => {
  try {
    const {
      sellerId, orderType, items,
      customerId, customerName, customerPhone,
      customerAddress, city, pincode, latitude, longitude,
      startDate, endDate, durationDays,
      subtotal, deliveryCharge, total, depositAmount,
      paymentMethod, notes,
    } = req.body;

    if (!sellerId || !orderType || !items?.length || !subtotal || !total) {
      return res.status(400).json({ success: false, message: 'Missing required order fields' });
    }

    // Build item snapshots and decrement stock for material orders
    const snapshotItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);

        if (orderType === 'material') {
          if (product.stock < item.qty) {
            throw new Error(`Insufficient stock for "${product.title}"`);
          }
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.qty, sold: item.qty },
          });
        }

        return {
          productId: product._id,
          title:     product.title,
          image:     product.images?.[0] || null,
          price:     product.price,
          unit:      product.unit,
          qty:       item.qty,
          days:      item.days   || null,
          subtotal:  item.subtotal,
        };
      })
    );

    const order = await SellerOrder.create({
      seller:          sellerId,
      customerId:      customerId      || '',
      customerName:    customerName    || '',
      customerPhone:   customerPhone   || '',
      customerAddress: customerAddress || '',
      city:            city            || '',
      pincode:         pincode         || '',
      latitude:        latitude        || null,
      longitude:       longitude       || null,
      orderType,
      items:           snapshotItems,
      startDate:       startDate       ? new Date(startDate)  : null,
      endDate:         endDate         ? new Date(endDate)    : null,
      durationDays:    durationDays    || null,
      subtotal,
      deliveryCharge:  deliveryCharge  || 0,
      total,
      depositAmount:   depositAmount   || 0,
      paymentMethod:   paymentMethod   || 'cod',
      notes:           notes           || '',
    });

    // Real-time: notify seller's socket room
    const io = getIO();
    io.to(`seller_${sellerId}`).emit('new_order', {
      orderId:      order._id,
      orderType,
      customerName: customerName || '',
      total,
    });

    // Push notification to seller device
    const seller = await Seller.findById(sellerId).select('pushToken');
    await sendPush(
      seller?.pushToken,
      '🛒 New Order Received',
      `${customerName || 'A customer'} placed an order · ₹${total}`,
      { orderId: order._id.toString() }
    );

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/orders ───────────────────────────────────────────────────────────
// Seller fetches their own orders
const getOrders = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;

    const query = { seller: req.seller._id };
    if (status && status !== 'all') query.status    = status;
    if (type   && type   !== 'all') query.orderType = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      SellerOrder.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      SellerOrder.countDocuments(query),
    ]);

    res.json({
      success: true,
      orders,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
const getOrderById = async (req, res) => {
  try {
    const order = await SellerOrder.findOne({
      _id:    req.params.id,
      seller: req.seller._id,
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/orders/:id/status ─────────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }

    const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.seller._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;

    // Rental returned → restore stock
    if (status === 'returned') {
      await Promise.all(
        order.items.map((item) =>
          item.productId
            ? Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.qty } })
            : Promise.resolve()
        )
      );
    }

    await order.save();

    // Real-time update
    const io = getIO();
    io.to(`seller_${req.seller._id}`).emit('order_updated', {
      orderId: order._id,
      status,
    });
    // Notify customer if they're listening
    if (order.customerId) {
      io.to(`customer_${order.customerId}`).emit('seller_order_status_changed', {
        orderId: order._id,
        status,
      });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/orders/customer/:customerId ──────────────────────────────────────
// Customer app calls this to see their seller orders
const getOrdersByCustomer = async (req, res) => {
  try {
    const orders = await SellerOrder.find({ customerId: req.params.customerId })
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { placeOrder, getOrders, getOrderById, updateOrderStatus, getOrdersByCustomer };
// conzasb/controllers/orderController.js
//
// SECURITY HARDENING (P0 fixes applied):
//  1. Client-supplied subtotal/total/depositAmount are IGNORED — all prices are
//     recomputed server-side from the authoritative Product documents.
//  2. Stock deduction is ATOMIC: a single findOneAndUpdate with a $gte guard
//     replaces the old read-then-write pattern that allowed overselling.
//  3. The entire placeOrder flow runs inside a MongoDB multi-document transaction
//     so a partially-deducted cart is always rolled back on failure.
//  4. Idempotency: a client-supplied idempotencyKey (or a server-generated one)
//     prevents duplicate orders on network retry.
//  5. Rental stock-restore is guarded by the `stockRestored` flag to prevent
//     double-restoration on repeated PATCH calls or service restarts.
//
'use strict';

const mongoose    = require('mongoose');
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

// ── Authoritative server-side pricing helpers ─────────────────────────────────
// Deterministic delivery charge derived from sellerId — never from client.
const sellerDeliveryHash = (sellerId) => {
  const str = String(sellerId || '');
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/**
 * Compute authoritative pricing for a MATERIAL order (runs inside session).
 * All client-supplied prices are ignored; product prices loaded from DB.
 */
const computeMaterialPricing = async (items, sellerId, session) => {
  const productIds = items.map((i) => i.productId);
  const products   = await Product.find({ _id: { $in: productIds }, seller: sellerId })
    .session(session).lean();
  const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

  let subtotal = 0;
  const snapshotItems = [];

  for (const item of items) {
    const pid     = item.productId?.toString();
    const product = productMap[pid];
    if (!product)                    throw new Error(`Product not found or does not belong to this seller: ${pid}`);
    if (product.type !== 'material') throw new Error(`Product "${product.title}" is not a material item`);
    if (product.isAvailable === false) throw new Error(`Product "${product.title}" is currently unavailable`);

    const qty = Math.floor(Number(item.qty));
    if (!Number.isFinite(qty) || qty <= 0) throw new Error(`Invalid quantity for "${product.title}"`);

    const unitPrice   = Number(product.price);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error(`Invalid price for "${product.title}"`);

    const itemSubtotal = Math.round(unitPrice * qty);
    subtotal += itemSubtotal;
    snapshotItems.push({
      productId: product._id,
      title:     product.title,
      image:     product.images?.[0] || null,
      price:     unitPrice,          // authoritative DB price
      unit:      product.unit || 'piece',
      qty,
      days:      null,
      subtotal:  itemSubtotal,       // server-computed, not client's figure
    });
  }

  const deliveryCharge = Math.round((150 + (sellerDeliveryHash(sellerId) % 200)) / 10) * 10;
  return { snapshotItems, subtotal, deliveryCharge, total: subtotal + deliveryCharge, depositAmount: 0 };
};

/**
 * Compute authoritative pricing for a RENTAL order (runs inside session).
 * All client-supplied prices are ignored; product prices loaded from DB.
 */
const computeRentalPricing = async (items, sellerId, orderDurationDays, session) => {
  const productIds = items.map((i) => i.productId);
  const products   = await Product.find({ _id: { $in: productIds }, seller: sellerId })
    .session(session).lean();
  const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

  let subtotal = 0, depositAmount = 0;
  const snapshotItems = [];

  for (const item of items) {
    const pid     = item.productId?.toString();
    const product = productMap[pid];
    if (!product)                  throw new Error(`Product not found or does not belong to this seller: ${pid}`);
    if (product.type !== 'rental') throw new Error(`Product "${product.title}" is not a rental item`);
    if (product.isAvailable === false) throw new Error(`Product "${product.title}" is currently unavailable for rental`);

    const qty  = Math.floor(Number(item.qty  || 1));
    const days = Math.floor(Number(item.days || item.rentalDays || orderDurationDays || 1));
    if (!Number.isFinite(qty)  || qty  <= 0) throw new Error(`Invalid quantity for "${product.title}"`);
    if (!Number.isFinite(days) || days <= 0) throw new Error(`Invalid rental days for "${product.title}"`);

    const minRentalDays = Number(product.minRentalDays) || 1;
    if (days < minRentalDays) throw new Error(`Minimum rental duration for "${product.title}" is ${minRentalDays} day(s)`);

    const pricePerDay = Number(product.rentalPrice || product.price);
    const unitDeposit = Number(product.deposit) || 0;
    if (!Number.isFinite(pricePerDay) || pricePerDay < 0) throw new Error(`Invalid rental rate for "${product.title}"`);

    const itemSubtotal = Math.round(pricePerDay * days * qty);
    const itemDeposit  = Math.round(unitDeposit * qty);
    subtotal      += itemSubtotal;
    depositAmount += itemDeposit;
    snapshotItems.push({
      productId: product._id,
      title:     product.title,
      image:     product.images?.[0] || null,
      price:     pricePerDay,
      unit:      product.unit || 'day',
      qty,
      days,
      subtotal:  itemSubtotal,
    });
  }

  const deliveryCharge = Math.round((600 + (sellerDeliveryHash(sellerId) % 600)) / 10) * 10;
  return { snapshotItems, subtotal, deliveryCharge, depositAmount, total: subtotal + deliveryCharge };
};

// ── POST /api/orders ──────────────────────────────────────────────────────────
// Called by the customer app to place a seller order.
//
// All financial values are computed exclusively on the server.
// Client-supplied subtotal/deliveryCharge/total/depositAmount are ignored.
// Stock deduction is atomic (findOneAndUpdate + $gte) inside a transaction.
const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      sellerId, orderType, items,
      customerId, customerName, customerPhone,
      customerAddress, city, pincode, latitude, longitude,
      startDate, endDate, durationDays,
      paymentMethod, notes,
      idempotencyKey: clientKey,
      // ↓ subtotal, deliveryCharge, total, depositAmount intentionally NOT destructured
    } = req.body;

    if (!sellerId || !orderType || !items?.length) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Missing required order fields' });
    }
    if (!['material', 'rental'].includes(orderType)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Invalid orderType' });
    }

    // ── Idempotency guard ──────────────────────────────────────────────────
    const idempotencyKey = clientKey || new mongoose.Types.ObjectId().toString();
    if (clientKey) {
      const existing = await SellerOrder.findOne({ idempotencyKey: clientKey }).session(session).lean();
      if (existing) {
        await session.abortTransaction();
        return res.status(200).json({ success: true, order: existing, idempotent: true });
      }
    }

    // ── Server-side authoritative pricing (all client figures discarded) ───
    const pricing = orderType === 'material'
      ? await computeMaterialPricing(items, sellerId, session)
      : await computeRentalPricing(items, sellerId, durationDays, session);

    const { snapshotItems, subtotal, deliveryCharge, depositAmount, total } = pricing;

    // ── Atomic stock deduction (material orders only) ──────────────────────
    // findOneAndUpdate with $gte: qty guarantees stock never goes negative and
    // eliminates the TOCTOU race window of the old read → check → write flow.
    if (orderType === 'material') {
      for (const snap of snapshotItems) {
        const updated = await Product.findOneAndUpdate(
          { _id: snap.productId, seller: sellerId, stock: { $gte: snap.qty } },
          { $inc: { stock: -snap.qty, sold: snap.qty } },
          { session, new: false }
        );
        if (!updated) {
          await session.abortTransaction();
          return res.status(409).json({
            success: false,
            message: `Insufficient stock for "${snap.title}". Please adjust your cart.`,
          });
        }
      }
    }

    // ── Persist order (inside transaction) ────────────────────────────────
    const [order] = await SellerOrder.create(
      [{
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
        startDate:       startDate    ? new Date(startDate)  : null,
        endDate:         endDate      ? new Date(endDate)    : null,
        durationDays:    durationDays || null,
        // ↓ authoritative server-computed figures — never client values
        subtotal,
        deliveryCharge,
        total,
        depositAmount,
        paymentMethod:   paymentMethod || 'cod',
        notes:           notes         || '',
        idempotencyKey,
        stockRestored:   false,
      }],
      { session }
    );

    await session.commitTransaction();

    // ── Notify seller (after commit — data is now durable) ─────────────────
    try {
      const io = getIO();
      io.to(`seller_${sellerId}`).emit('new_order', {
        orderId:      order._id,
        orderType,
        customerName: customerName || '',
        total,        // server-authoritative figure
      });
    } catch (_) {}

    // Push notification (best-effort, non-blocking)
    Seller.findById(sellerId).select('pushToken').then((seller) =>
      sendPush(
        seller?.pushToken,
        '🛒 New Order Received',
        `${customerName || 'A customer'} placed an order · ₹${total}`,
        { orderId: order._id.toString() }
      )
    ).catch(() => {});

    return res.status(201).json({ success: true, order });
  } catch (err) {
    try { await session.abortTransaction(); } catch (_) {}
    return res.status(err.status || 500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
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

    // ── Rental stock restore — idempotent via stockRestored flag ──────────
    // Guard prevents double-restoration if PATCH is called twice with
    // status=returned (network retry, admin re-patch, service restart, etc.).
    if (status === 'returned' && order.orderType === 'rental' && !order.stockRestored) {
      await Promise.all(
        order.items.map((item) =>
          item.productId
            ? Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.qty } })
            : Promise.resolve()
        )
      );
      order.stockRestored = true;
    }

    await order.save();

    // ── Real-time update (best-effort) ─────────────────────────────────────
    try {
      const io = getIO();
      io.to(`seller_${req.seller._id}`).emit('order_updated', { orderId: order._id, status });
      if (order.customerId) {
        io.to(`customer_${order.customerId}`).emit('seller_order_status_changed', {
          orderId: order._id,
          status,
        });
      }
    } catch (_) {}

    return res.json({ success: true, order });
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
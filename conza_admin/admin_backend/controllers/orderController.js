const Order = require('../models/Order')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

exports.getOrders = async (req, res, next) => {
  try {
    const { search = '', status, page = 1, limit = 20 } = req.query
    const query = {}
    if (search) query.customerName = { $regex: search, $options: 'i' }
    if (status && status !== 'all') query.status = status

    const total = await Order.countDocuments(query)
    const orders = await Order.find(query)
      .populate('customer', 'fullName phone')
      .populate('seller', 'name shopName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
    sendPaginated(res, orders, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'fullName phone')
      .populate('seller', 'name shopName')
    if (!order) return next(createError(404, 'Order not found.'))
    sendSuccess(res, 200, 'Order fetched', { order })
  } catch (err) {
    next(err)
  }
}

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!order) return next(createError(404, 'Order not found.'))
    req.auditTarget = `Order #${req.params.id}`
    req.auditDetails = `Status changed to ${status}`
    sendSuccess(res, 200, 'Order status updated', { order })
  } catch (err) {
    next(err)
  }
}

exports.getOrderDisputes = async (req, res, next) => {
  try {
    const orders = await Order.find({ status: 'disputed' }).sort({ createdAt: -1 })
    sendSuccess(res, 200, 'Order disputes fetched', { orders })
  } catch (err) {
    next(err)
  }
}

exports.getOrderTracking = async (req, res, next) => {
  try {
    const orders = await Order.find({ status: { $in: ['confirmed', 'packed', 'out_for_delivery'] } }).sort({ createdAt: -1 })
    sendSuccess(res, 200, 'Tracking orders fetched', { orders })
  } catch (err) {
    next(err)
  }
}

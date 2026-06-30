const Customer = require('../models/Customer')
const Booking = require('../models/Booking')
const Transaction = require('../models/Transaction')
const Complaint = require('../models/Complaint')
const Order = require('../models/Order')
const Seller = require('../models/Seller')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')
const { bustCustomerSessionCache } = require('../config/customersRedis')

exports.getCustomers = async (req, res, next) => {
  try {
    const { search = '', status, page = 1, limit = 20 } = req.query
    const query = {}
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }
    if (status && status !== 'all') query.status = status

    const total = await Customer.countDocuments(query)
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    sendPaginated(res, customers, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer) {
      console.warn(`[CustomerController] Customer not found for id: ${req.params.id}`)
      return next(createError(404, 'Customer not found.'))
    }
    sendSuccess(res, 200, 'Customer fetched', { customer })
  } catch (err) {
    console.error(`[CustomerController] getCustomerById error:`, err.message)
    next(err)
  }
}

exports.updateCustomerStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    const customer = await Customer.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true })
    if (!customer) return next(createError(404, 'Customer not found.'))

    // Immediately bust the Redis session cache in the customer backend so
    // the status change (e.g. suspended) takes effect on the very next request
    // instead of waiting up to 60 s for the cache TTL to expire.
    await bustCustomerSessionCache(req.params.id)

    req.auditTarget = `Customer #${req.params.id} - ${customer.fullName}`
    req.auditDetails = `Status changed to ${status}`

    sendSuccess(res, 200, 'Customer status updated', { customer })
  } catch (err) {
    next(err)
  }
}

exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id)
    if (!customer) return next(createError(404, 'Customer not found.'))

    req.auditTarget = `Customer #${req.params.id} - ${customer.fullName}`
    req.auditDetails = `Customer account deleted`

    sendSuccess(res, 200, 'Customer deleted successfully')
  } catch (err) {
    next(err)
  }
}

exports.getCustomerBookings = async (req, res, next) => {
  try {
    // The real Booking collection uses 'user' (ObjectId) — query as string since
    // the admin model binds to customersDB with strict:false.
    const bookings = await Booking.find({
      $or: [{ user: req.params.id }, { userId: req.params.id }],
    }).sort({ createdAt: -1 })
    sendSuccess(res, 200, 'Customer bookings fetched', { bookings })
  } catch (err) {
    next(err)
  }
}

exports.getCustomerPayments = async (req, res, next) => {
  try {
    const payments = await Transaction.find({ userId: req.params.id }).sort({ createdAt: -1 })
    sendSuccess(res, 200, 'Customer payments fetched', { payments })
  } catch (err) {
    next(err)
  }
}

exports.getCustomerComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ userId: req.params.id }).sort({ createdAt: -1 })
    sendSuccess(res, 200, 'Customer complaints fetched', { complaints })
  } catch (err) {
    next(err)
  }
}

exports.getCustomerOrders = async (req, res, next) => {
  try {
    // The real SellerOrder collection uses 'customer' (ObjectId)
    const orders = await Order.find({ customer: req.params.id })
      .populate('seller', 'name shopName')
      .sort({ createdAt: -1 })
    sendSuccess(res, 200, 'Customer orders fetched', { orders })
  } catch (err) {
    next(err)
  }
}
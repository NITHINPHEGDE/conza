const Customer = require('../models/Customer')
const Booking = require('../models/Booking')
const Transaction = require('../models/Transaction')
const Complaint = require('../models/Complaint')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

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
    const bookings = await Booking.find({ userId: req.params.id }).sort({ createdAt: -1 })
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
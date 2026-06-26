const { sendSuccess } = require('../utils/response')
const { mockUserAnalytics, mockRevenueAnalytics, mockBookingAnalytics, mockVendorAnalytics, mockConversionAnalytics } = require('../utils/mockData')
const Customer = require('../models/Customer')
const Booking = require('../models/Booking')
const Transaction = require('../models/Transaction')
const Vendor = require('../models/Vendor')

exports.getUserAnalytics = async (req, res, next) => {
  try {
    const totalCustomers = await Customer.countDocuments()
    const data = totalCustomers > 0
      ? { ...mockUserAnalytics, totalUsers: totalCustomers }
      : mockUserAnalytics
    sendSuccess(res, 200, 'User analytics fetched', { analytics: data })
  } catch (err) {
    next(err)
  }
}

exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Revenue analytics fetched', { analytics: mockRevenueAnalytics })
  } catch (err) {
    next(err)
  }
}

exports.getBookingAnalytics = async (req, res, next) => {
  try {
    const totalBookings = await Booking.countDocuments()
    const data = totalBookings > 0
      ? { ...mockBookingAnalytics, totalBookings }
      : mockBookingAnalytics
    sendSuccess(res, 200, 'Booking analytics fetched', { analytics: data })
  } catch (err) {
    next(err)
  }
}

exports.getVendorAnalytics = async (req, res, next) => {
  try {
    const totalVendors = await Vendor.countDocuments()
    const data = totalVendors > 0
      ? { ...mockVendorAnalytics, totalVendors }
      : mockVendorAnalytics
    sendSuccess(res, 200, 'Vendor analytics fetched', { analytics: data })
  } catch (err) {
    next(err)
  }
}

exports.getConversionAnalytics = async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Conversion analytics fetched', { analytics: mockConversionAnalytics })
  } catch (err) {
    next(err)
  }
}

const Vendor = require('../models/Vendor')
const Order = require('../models/Order')
const Review = require('../models/Review')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

exports.getVendors = async (req, res, next) => {
  try {
    const { search = '', status, type, page = 1, limit = 20 } = req.query
    const query = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shopName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ]
    }
    if (status && status !== 'all') query.status = status
    if (type && type !== 'all') query.sellerType = type

    const total = await Vendor.countDocuments(query)
    const vendors = await Vendor.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))

    // totalOrders/totalRevenue on the Vendor doc are stale stored counters,
    // so compute the real figures from the actual Order (sellerorders)
    // collection for the vendors on this page.
    const vendorIds = vendors.map((v) => v._id)
    const orderStats = await Order.aggregate([
      { $match: { seller: { $in: vendorIds } } },
      { $group: { _id: '$seller', orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
    ])
    const statsMap = orderStats.reduce((acc, s) => ({ ...acc, [String(s._id)]: s }), {})
    const vendorsWithStats = vendors.map((v) => {
      const stats = statsMap[String(v._id)]
      return {
        ...v.toObject(),
        totalOrders: stats?.orders || 0,
        totalRevenue: stats?.revenue || 0,
      }
    })

    sendPaginated(res, vendorsWithStats, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getVendorById = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
    if (!vendor) return next(createError(404, 'Vendor not found.'))
    sendSuccess(res, 200, 'Vendor fetched', { vendor })
  } catch (err) {
    next(err)
  }
}

exports.updateVendorStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true })
    if (!vendor) return next(createError(404, 'Vendor not found.'))
    req.auditTarget = `Vendor #${req.params.id} - ${vendor.name}`
    req.auditDetails = `Status changed to ${status}`
    sendSuccess(res, 200, 'Vendor status updated', { vendor })
  } catch (err) {
    next(err)
  }
}

exports.verifyVendor = async (req, res, next) => {
  try {
    const { isVerified } = req.body
    const vendor = await Vendor.findById(req.params.id)
    if (!vendor) return next(createError(404, 'Vendor not found.'))

    vendor.isVerified = isVerified !== undefined ? !!isVerified : true
    if (vendor.isVerified && vendor.status === 'pending_verification') {
      vendor.status = 'active'
    }

    await vendor.save()
    req.auditTarget = `Vendor #${req.params.id} - ${vendor.name}`
    req.auditDetails = `Verification set to ${vendor.isVerified}`
    sendSuccess(res, 200, 'Vendor verification updated', { vendor })
  } catch (err) {
    next(err)
  }
}

exports.getVendorOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ seller: req.params.id }).sort({ createdAt: -1 })
    sendSuccess(res, 200, 'Vendor orders fetched', { orders })
  } catch (err) {
    next(err)
  }
}

exports.getVendorEarnings = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id).select('totalRevenue walletBalance name')
    if (!vendor) return next(createError(404, 'Vendor not found.'))
    sendSuccess(res, 200, 'Vendor earnings fetched', { earnings: { totalRevenue: vendor.totalRevenue, walletBalance: vendor.walletBalance }, vendor: { name: vendor.name } })
  } catch (err) {
    next(err)
  }
}

exports.getVendorReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ entityType: 'vendor', entityId: req.params.id }).sort({ createdAt: -1 })
    sendSuccess(res, 200, 'Vendor reviews fetched', { reviews })
  } catch (err) {
    next(err)
  }
}

exports.getPendingVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.find({ status: 'pending_verification' }).sort({ createdAt: -1 })
    sendSuccess(res, 200, 'Pending vendors fetched', { vendors })
  } catch (err) {
    next(err)
  }
}
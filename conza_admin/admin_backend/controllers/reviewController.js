const Review = require('../models/Review')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

const getReviews = (entityType) => async (req, res, next) => {
  try {
    const { search = '', status, page = 1, limit = 20 } = req.query
    const query = {}
    if (entityType) query.entityType = entityType
    if (search) query.$or = [{ customer: { $regex: search, $options: 'i' } }, { comment: { $regex: search, $options: 'i' } }]
    if (status && status !== 'all') query.status = status

    const total = await Review.countDocuments(query)
    const reviews = await Review.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, reviews, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getWorkerReviews = getReviews('worker')
exports.getVendorReviews = getReviews('vendor')
exports.getProductReviews = getReviews('product')
exports.getAllReviews = getReviews(null)

exports.updateReview = async (req, res, next) => {
  try {
    const { status } = req.body
    const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!review) return next(createError(404, 'Review not found.'))
    req.auditTarget = `Review #${req.params.id}`
    req.auditDetails = `Review ${status}`
    sendSuccess(res, 200, 'Review updated', { review })
  } catch (err) {
    next(err)
  }
}

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id)
    if (!review) return next(createError(404, 'Review not found.'))
    req.auditTarget = `Review #${req.params.id}`
    req.auditDetails = `Review deleted`
    sendSuccess(res, 200, 'Review deleted successfully')
  } catch (err) {
    next(err)
  }
}

exports.getAnalytics = async (req, res, next) => {
  try {
    const [totalReviews, avgRatingResult, workerCount, vendorCount, productCount] = await Promise.all([
      Review.countDocuments(),
      Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
      Review.countDocuments({ entityType: 'worker' }),
      Review.countDocuments({ entityType: 'vendor' }),
      Review.countDocuments({ entityType: 'product' }),
    ])
    sendSuccess(res, 200, 'Review analytics fetched', {
      analytics: {
        totalReviews,
        avgRating: avgRatingResult[0]?.avg?.toFixed(1) || 0,
        workerReviews: workerCount,
        vendorReviews: vendorCount,
        productReviews: productCount,
      }
    })
  } catch (err) {
    next(err)
  }
}

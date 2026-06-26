const Promotion = require('../models/Promotion')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

const getPromotions = (type) => async (req, res, next) => {
  try {
    const { search = '', status, page = 1, limit = 20 } = req.query
    const query = type ? { type } : {}
    if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }]
    if (status && status !== 'all') query.status = status

    const total = await Promotion.countDocuments(query)
    const promotions = await Promotion.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, promotions, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getCoupons = getPromotions('coupon')
exports.getCashback = getPromotions('cashback')
exports.getReferrals = getPromotions('referral')
exports.getSeasonalOffers = getPromotions('seasonal')
exports.getAllPromotions = getPromotions(null)

exports.createPromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.create(req.body)
    req.auditTarget = `Promotion - ${promotion.title}`
    req.auditDetails = `Created ${promotion.type} promotion`
    sendSuccess(res, 201, 'Promotion created', { promotion })
  } catch (err) {
    next(err)
  }
}

exports.updatePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!promotion) return next(createError(404, 'Promotion not found.'))
    req.auditTarget = `Promotion #${req.params.id}`
    req.auditDetails = `Updated ${promotion.type} promotion`
    sendSuccess(res, 200, 'Promotion updated', { promotion })
  } catch (err) {
    next(err)
  }
}

exports.deletePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id)
    if (!promotion) return next(createError(404, 'Promotion not found.'))
    req.auditTarget = `Promotion #${req.params.id}`
    req.auditDetails = `Promotion deleted`
    sendSuccess(res, 200, 'Promotion deleted')
  } catch (err) {
    next(err)
  }
}

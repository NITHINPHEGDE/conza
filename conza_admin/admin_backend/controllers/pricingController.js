const Pricing = require('../models/Pricing')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

exports.getPricing = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 50 } = req.query
    const query = {}
    if (type && type !== 'all') query.type = type

    const total = await Pricing.countDocuments(query)
    const pricing = await Pricing.find(query).sort({ category: 1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, pricing, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.createPricing = async (req, res, next) => {
  try {
    const pricing = await Pricing.create(req.body)
    req.auditTarget = `Pricing - ${pricing.category}`
    req.auditDetails = `Created pricing for ${pricing.category}`
    sendSuccess(res, 201, 'Pricing created', { pricing })
  } catch (err) {
    next(err)
  }
}

exports.updatePricing = async (req, res, next) => {
  try {
    const pricing = await Pricing.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!pricing) return next(createError(404, 'Pricing not found.'))
    req.auditTarget = `Pricing #${req.params.id} - ${pricing.category}`
    req.auditDetails = `Updated pricing: base charge = ${pricing.baseCharge}`
    sendSuccess(res, 200, 'Pricing updated', { pricing })
  } catch (err) {
    next(err)
  }
}

exports.deletePricing = async (req, res, next) => {
  try {
    const pricing = await Pricing.findByIdAndDelete(req.params.id)
    if (!pricing) return next(createError(404, 'Pricing not found.'))
    sendSuccess(res, 200, 'Pricing deleted')
  } catch (err) {
    next(err)
  }
}

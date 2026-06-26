const BusinessPartner = require('../models/BusinessPartner')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

exports.getBusinessPartners = async (req, res, next) => {
  try {
    const { search = '', status, page = 1, limit = 20 } = req.query
    const query = {}
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { territory: { $regex: search, $options: 'i' } }]
    if (status && status !== 'all') query.status = status

    const total = await BusinessPartner.countDocuments(query)
    const partners = await BusinessPartner.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, partners, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getBPById = async (req, res, next) => {
  try {
    const partner = await BusinessPartner.findById(req.params.id)
    if (!partner) return next(createError(404, 'Business partner not found.'))
    sendSuccess(res, 200, 'Business partner fetched', { partner })
  } catch (err) {
    next(err)
  }
}

exports.updateBPStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    const partner = await BusinessPartner.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!partner) return next(createError(404, 'Business partner not found.'))
    sendSuccess(res, 200, 'BP status updated', { partner })
  } catch (err) {
    next(err)
  }
}

exports.getBPReferrals = async (req, res, next) => {
  try {
    const partner = await BusinessPartner.findById(req.params.id)
    if (!partner) return next(createError(404, 'Business partner not found.'))
    sendSuccess(res, 200, 'BP referrals fetched', { referrals: [], partner })
  } catch (err) {
    next(err)
  }
}

exports.getBPCommissions = async (req, res, next) => {
  try {
    const partner = await BusinessPartner.findById(req.params.id)
    if (!partner) return next(createError(404, 'Business partner not found.'))
    sendSuccess(res, 200, 'BP commissions fetched', { commissions: [], partner })
  } catch (err) {
    next(err)
  }
}

exports.getTerritories = async (req, res, next) => {
  try {
    const territories = await BusinessPartner.distinct('territory')
    const partnersByTerritory = await BusinessPartner.aggregate([
      { $group: { _id: '$territory', count: { $sum: 1 }, partners: { $push: '$name' } } },
    ])
    sendSuccess(res, 200, 'Territories fetched', { territories, partnersByTerritory })
  } catch (err) {
    next(err)
  }
}

const Content = require('../models/Content')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

const getContent = (type) => async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const query = type ? { type } : {}
    if (status && status !== 'all') query.status = status

    const total = await Content.countDocuments(query)
    const content = await Content.find(query).sort({ order: 1, createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, content, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getFAQs = getContent('faq')
exports.getTerms = getContent('terms')
exports.getPrivacy = getContent('privacy')
exports.getAbout = getContent('about')
exports.getHelp = getContent('help')
exports.getBanners = getContent('banner')

exports.createContent = async (req, res, next) => {
  try {
    const content = await Content.create(req.body)
    req.auditTarget = `Content - ${content.title || content.type}`
    req.auditDetails = `Created ${content.type} content`
    sendSuccess(res, 201, 'Content created', { content })
  } catch (err) {
    next(err)
  }
}

exports.updateContent = async (req, res, next) => {
  try {
    const content = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!content) return next(createError(404, 'Content not found.'))
    req.auditTarget = `Content #${req.params.id}`
    req.auditDetails = `Updated ${content.type} content`
    sendSuccess(res, 200, 'Content updated', { content })
  } catch (err) {
    next(err)
  }
}

exports.deleteContent = async (req, res, next) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id)
    if (!content) return next(createError(404, 'Content not found.'))
    req.auditTarget = `Content #${req.params.id}`
    req.auditDetails = `Deleted ${content.type} content`
    sendSuccess(res, 200, 'Content deleted')
  } catch (err) {
    next(err)
  }
}

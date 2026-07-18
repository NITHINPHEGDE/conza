const Content = require('../models/Content')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

const VALID_APP_TARGETS = ['customer', 'worker', 'vendor']

const getContent = (type) => async (req, res, next) => {
  try {
    const { status, appTarget, page = 1, limit = 20 } = req.query
    const query = type ? { type } : {}
    if (status && status !== 'all') query.status = status
    if (appTarget && appTarget !== 'all') query.appTarget = appTarget

    const total = await Content.countDocuments(query)
    const content = await Content.find(query).sort({ order: 1, createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, content, total, page, limit)
  } catch (err) {
    next(err)
  }
}

// ── Legal (Terms & Privacy & Refund) — per app, admin protected ────────────
exports.getLegal = async (req, res, next) => {
  try {
    const { appTarget } = req.params
    if (!VALID_APP_TARGETS.includes(appTarget)) {
      return next(createError(400, 'Invalid appTarget. Must be customer, worker, or vendor.'))
    }
    const docs = await Content.find({ type: { $in: ['terms', 'privacy', 'refund'] }, appTarget })
    const terms = docs.find((d) => d.type === 'terms') || null
    const privacy = docs.find((d) => d.type === 'privacy') || null
    const refund = docs.find((d) => d.type === 'refund') || null
    sendSuccess(res, 200, 'Legal content retrieved', { terms, privacy, refund })
  } catch (err) {
    next(err)
  }
}

exports.upsertLegal = async (req, res, next) => {
  try {
    const { type, appTarget } = req.params
    if (!['terms', 'privacy', 'refund'].includes(type)) {
      return next(createError(400, 'Invalid type. Must be terms, privacy, or refund.'))
    }
    if (!VALID_APP_TARGETS.includes(appTarget)) {
      return next(createError(400, 'Invalid appTarget. Must be customer, worker, or vendor.'))
    }
    const { title, content } = req.body
    const doc = await Content.findOneAndUpdate(
      { type, appTarget },
      { type, appTarget, title, content, status: 'published' },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
    req.auditTarget = `${type} - ${appTarget}`
    req.auditDetails = `Updated ${type} for ${appTarget} app`
    sendSuccess(res, 200, `${type} updated`, { content: doc })
  } catch (err) {
    next(err)
  }
}

// ── About Us — shared across all apps, admin protected ──────────────────────
exports.getAboutContent = async (req, res, next) => {
  try {
    const doc = await Content.findOne({ type: 'about', appTarget: 'all' })
    sendSuccess(res, 200, 'About content retrieved', { about: doc || null })
  } catch (err) {
    next(err)
  }
}

exports.upsertAboutContent = async (req, res, next) => {
  try {
    const { title, content } = req.body
    const doc = await Content.findOneAndUpdate(
      { type: 'about', appTarget: 'all' },
      { type: 'about', appTarget: 'all', title, content, status: 'published' },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
    req.auditTarget = 'About Us'
    req.auditDetails = 'Updated About Us content'
    sendSuccess(res, 200, 'About Us updated', { content: doc })
  } catch (err) {
    next(err)
  }
}

// ── Public endpoints — no auth, consumed by Customer/Worker/Vendor apps ─────
exports.getPublicLegal = async (req, res, next) => {
  try {
    const { appTarget } = req.params
    if (!VALID_APP_TARGETS.includes(appTarget)) {
      return next(createError(400, 'Invalid appTarget.'))
    }
    const docs = await Content.find({ type: { $in: ['terms', 'privacy', 'refund'] }, appTarget, status: 'published' })
      .select('type title content updatedAt')
      .lean()
    const terms = docs.find((d) => d.type === 'terms') || null
    const privacy = docs.find((d) => d.type === 'privacy') || null
    const refund = docs.find((d) => d.type === 'refund') || null
    sendSuccess(res, 200, 'Legal content retrieved', { terms, privacy, refund })
  } catch (err) {
    next(err)
  }
}

exports.getPublicAbout = async (req, res, next) => {
  try {
    const about = await Content.findOne({ type: 'about', appTarget: 'all', status: 'published' })
      .select('title content updatedAt')
      .lean()
    sendSuccess(res, 200, 'About content retrieved', { about: about || null })
  } catch (err) {
    next(err)
  }
}

exports.getFAQs = getContent('faq')
exports.getTerms = getContent('terms')
exports.getPrivacy = getContent('privacy')
exports.getRefund = getContent('refund')
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

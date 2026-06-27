const FAQ = require('../models/FAQ')
const HelpArticle = require('../models/HelpArticle')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

const VALID_APP_TARGETS = ['customer', 'worker', 'vendor']

// ── FAQ Controllers ──────────────────────────────────────────────────────────

exports.getFAQs = async (req, res, next) => {
  try {
    const { appTarget, status, page = 1, limit = 50 } = req.query
    const query = {}

    if (appTarget) {
      if (!VALID_APP_TARGETS.includes(appTarget)) {
        return next(createError(400, 'Invalid appTarget. Must be customer, worker, or vendor.'))
      }
      query.appTarget = appTarget
    }

    if (status && status !== 'all') {
      query.status = status
    }

    const total = await FAQ.countDocuments(query)
    const faqs = await FAQ.find(query)
      .sort({ appTarget: 1, sectionTitle: 1, order: 1, createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean()

    sendPaginated(res, faqs, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getFAQById = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id).lean()
    if (!faq) return next(createError(404, 'FAQ not found.'))
    sendSuccess(res, 200, 'FAQ retrieved', { faq })
  } catch (err) {
    next(err)
  }
}

exports.createFAQ = async (req, res, next) => {
  try {
    const { question, answer, appTarget, sectionTitle, sectionIcon, order, status } = req.body

    if (!VALID_APP_TARGETS.includes(appTarget)) {
      return next(createError(400, 'Invalid appTarget. Must be customer, worker, or vendor.'))
    }

    const faq = await FAQ.create({ question, answer, appTarget, sectionTitle, sectionIcon, order, status })

    req.auditTarget = `FAQ - ${faq.question.substring(0, 50)}`
    req.auditDetails = `Created FAQ for ${faq.appTarget} app`

    sendSuccess(res, 201, 'FAQ created successfully', { faq })
  } catch (err) {
    next(err)
  }
}

exports.updateFAQ = async (req, res, next) => {
  try {
    const { appTarget } = req.body

    if (appTarget && !VALID_APP_TARGETS.includes(appTarget)) {
      return next(createError(400, 'Invalid appTarget. Must be customer, worker, or vendor.'))
    }

    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!faq) return next(createError(404, 'FAQ not found.'))

    req.auditTarget = `FAQ #${req.params.id}`
    req.auditDetails = `Updated FAQ for ${faq.appTarget} app`

    sendSuccess(res, 200, 'FAQ updated successfully', { faq })
  } catch (err) {
    next(err)
  }
}

exports.deleteFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id)
    if (!faq) return next(createError(404, 'FAQ not found.'))

    req.auditTarget = `FAQ #${req.params.id}`
    req.auditDetails = `Deleted FAQ for ${faq.appTarget} app`

    sendSuccess(res, 200, 'FAQ deleted successfully')
  } catch (err) {
    next(err)
  }
}

// Public endpoint — no auth required, consumed by customer/worker/vendor apps
exports.getPublicFAQs = async (req, res, next) => {
  try {
    const { appTarget } = req.params

    if (!VALID_APP_TARGETS.includes(appTarget)) {
      return next(createError(400, 'Invalid appTarget.'))
    }

    const faqs = await FAQ.find({ appTarget, status: 'active' })
      .sort({ sectionTitle: 1, order: 1, createdAt: -1 })
      .select('question answer sectionTitle sectionIcon order')
      .lean()

    // Group by sectionTitle for convenient frontend consumption
    const sectionsMap = {}
    faqs.forEach((faq) => {
      const key = faq.sectionTitle || 'General'
      if (!sectionsMap[key]) {
        sectionsMap[key] = {
          title: key,
          icon: faq.sectionIcon || '❓',
          items: [],
        }
      }
      sectionsMap[key].items.push({ q: faq.question, a: faq.answer })
    })

    const sections = Object.values(sectionsMap)

    sendSuccess(res, 200, 'FAQs retrieved', { sections, total: faqs.length })
  } catch (err) {
    next(err)
  }
}

// ── Help Article Controllers ─────────────────────────────────────────────────

exports.getHelpArticles = async (req, res, next) => {
  try {
    const { appTarget, status, page = 1, limit = 50 } = req.query
    const query = {}

    if (appTarget) {
      if (!VALID_APP_TARGETS.includes(appTarget)) {
        return next(createError(400, 'Invalid appTarget. Must be customer, worker, or vendor.'))
      }
      query.appTarget = appTarget
    }

    if (status && status !== 'all') {
      query.status = status
    }

    const total = await HelpArticle.countDocuments(query)
    const articles = await HelpArticle.find(query)
      .sort({ appTarget: 1, order: 1, createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean()

    sendPaginated(res, articles, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getHelpArticleById = async (req, res, next) => {
  try {
    const article = await HelpArticle.findById(req.params.id).lean()
    if (!article) return next(createError(404, 'Help article not found.'))
    sendSuccess(res, 200, 'Help article retrieved', { article })
  } catch (err) {
    next(err)
  }
}

exports.createHelpArticle = async (req, res, next) => {
  try {
    const { title, content, appTarget, status, order } = req.body

    if (!VALID_APP_TARGETS.includes(appTarget)) {
      return next(createError(400, 'Invalid appTarget. Must be customer, worker, or vendor.'))
    }

    const article = await HelpArticle.create({ title, content, appTarget, status, order })

    req.auditTarget = `Help Article - ${article.title}`
    req.auditDetails = `Created help article for ${article.appTarget} app`

    sendSuccess(res, 201, 'Help article created successfully', { article })
  } catch (err) {
    next(err)
  }
}

exports.updateHelpArticle = async (req, res, next) => {
  try {
    const { appTarget } = req.body

    if (appTarget && !VALID_APP_TARGETS.includes(appTarget)) {
      return next(createError(400, 'Invalid appTarget. Must be customer, worker, or vendor.'))
    }

    const article = await HelpArticle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!article) return next(createError(404, 'Help article not found.'))

    req.auditTarget = `Help Article #${req.params.id}`
    req.auditDetails = `Updated help article for ${article.appTarget} app`

    sendSuccess(res, 200, 'Help article updated successfully', { article })
  } catch (err) {
    next(err)
  }
}

exports.deleteHelpArticle = async (req, res, next) => {
  try {
    const article = await HelpArticle.findByIdAndDelete(req.params.id)
    if (!article) return next(createError(404, 'Help article not found.'))

    req.auditTarget = `Help Article #${req.params.id}`
    req.auditDetails = `Deleted help article for ${article.appTarget} app`

    sendSuccess(res, 200, 'Help article deleted successfully')
  } catch (err) {
    next(err)
  }
}

// Public endpoint — no auth required, consumed by apps
exports.getPublicHelpArticles = async (req, res, next) => {
  try {
    const { appTarget } = req.params

    if (!VALID_APP_TARGETS.includes(appTarget)) {
      return next(createError(400, 'Invalid appTarget.'))
    }

    // Increment view count for all fetched articles (fire-and-forget)
    HelpArticle.updateMany(
      { appTarget, status: 'published' },
      { $inc: { views: 1 } }
    ).catch((err) => console.error('View count update error:', err.message))

    const articles = await HelpArticle.find({ appTarget, status: 'published' })
      .sort({ order: 1, createdAt: -1 })
      .select('title content order createdAt')
      .lean()

    sendSuccess(res, 200, 'Help articles retrieved', { articles, total: articles.length })
  } catch (err) {
    next(err)
  }
}

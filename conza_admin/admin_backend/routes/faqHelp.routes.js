const express = require('express')
const router = express.Router()
const c = require('../controllers/faqHelpController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

// ── Public routes (no auth) — consumed by Customer, Worker, Vendor apps ──────
router.get('/public/faqs/:appTarget', c.getPublicFAQs)
router.get('/public/help/:appTarget', c.getPublicHelpArticles)

// ── Admin protected routes ────────────────────────────────────────────────────
router.use(protect)
router.use(requirePermission('content'))

// FAQs
router.get('/faqs', c.getFAQs)
router.get('/faqs/:id', c.getFAQById)
router.post(
  '/faqs',
  logAction('FAQ & Help Center', 'FAQ Created', 'content', 'low'),
  c.createFAQ
)
router.put(
  '/faqs/:id',
  logAction('FAQ & Help Center', 'FAQ Updated', 'content', 'low'),
  c.updateFAQ
)
router.delete(
  '/faqs/:id',
  logAction('FAQ & Help Center', 'FAQ Deleted', 'removal', 'medium'),
  c.deleteFAQ
)

// Help Articles
router.get('/help', c.getHelpArticles)
router.get('/help/:id', c.getHelpArticleById)
router.post(
  '/help',
  logAction('FAQ & Help Center', 'Help Article Created', 'content', 'low'),
  c.createHelpArticle
)
router.put(
  '/help/:id',
  logAction('FAQ & Help Center', 'Help Article Updated', 'content', 'low'),
  c.updateHelpArticle
)
router.delete(
  '/help/:id',
  logAction('FAQ & Help Center', 'Help Article Deleted', 'removal', 'medium'),
  c.deleteHelpArticle
)

module.exports = router

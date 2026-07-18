const express = require('express')
const router = express.Router()
const c = require('../controllers/contentController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

// ── Public routes (no auth) — consumed by Customer, Worker, Vendor apps ──────
router.get('/public/legal/:appTarget', c.getPublicLegal)
router.get('/public/about', c.getPublicAbout)

router.use(protect)
router.use(requirePermission('content'))

router.get('/faqs', c.getFAQs)
router.get('/terms', c.getTerms)
router.get('/privacy', c.getPrivacy)
router.get('/refund', c.getRefund)
router.get('/about', c.getAbout)
router.get('/help', c.getHelp)
router.get('/banners', c.getBanners)

// Legal (Terms & Privacy) — per app
router.get('/legal/:appTarget', c.getLegal)
router.put('/legal/:type/:appTarget', logAction('Content', 'Legal Content Updated', 'content', 'low'), c.upsertLegal)

// About Us — shared
router.get('/about-us', c.getAboutContent)
router.put('/about-us', logAction('Content', 'About Us Updated', 'content', 'low'), c.upsertAboutContent)

router.post('/', logAction('Content', 'Content Created', 'content', 'low'), c.createContent)
router.put('/:id', logAction('Content', 'Content Updated', 'content', 'low'), c.updateContent)
router.delete('/:id', logAction('Content', 'Content Deleted', 'removal', 'medium'), c.deleteContent)

module.exports = router

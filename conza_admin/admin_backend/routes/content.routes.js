const express = require('express')
const router = express.Router()
const c = require('../controllers/contentController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('content'))

router.get('/faqs', c.getFAQs)
router.get('/terms', c.getTerms)
router.get('/privacy', c.getPrivacy)
router.get('/about', c.getAbout)
router.get('/help', c.getHelp)
router.get('/banners', c.getBanners)
router.post('/', logAction('Content', 'Content Created', 'content', 'low'), c.createContent)
router.put('/:id', logAction('Content', 'Content Updated', 'content', 'low'), c.updateContent)
router.delete('/:id', logAction('Content', 'Content Deleted', 'removal', 'medium'), c.deleteContent)

module.exports = router

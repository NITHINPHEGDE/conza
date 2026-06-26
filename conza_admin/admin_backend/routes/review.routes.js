const express = require('express')
const router = express.Router()
const c = require('../controllers/reviewController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('reviews'))

router.get('/workers', c.getWorkerReviews)
router.get('/vendors', c.getVendorReviews)
router.get('/products', c.getProductReviews)
router.get('/analytics', c.getAnalytics)
router.put('/:id', logAction('Reviews', 'Review Updated', 'update', 'low'), c.updateReview)
router.delete('/:id', logAction('Reviews', 'Review Deleted', 'removal', 'medium'), c.deleteReview)

module.exports = router

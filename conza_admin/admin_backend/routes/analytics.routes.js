const express = require('express')
const router = express.Router()
const c = require('../controllers/analyticsController')
const { protect, requirePermission } = require('../middleware/auth')

router.use(protect)
router.use(requirePermission('analytics'))

router.get('/users', c.getUserAnalytics)
router.get('/revenue', c.getRevenueAnalytics)
router.get('/bookings', c.getBookingAnalytics)
router.get('/vendors', c.getVendorAnalytics)
router.get('/conversion', c.getConversionAnalytics)

module.exports = router

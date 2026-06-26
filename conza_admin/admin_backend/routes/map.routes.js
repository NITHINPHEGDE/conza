const express = require('express')
const router = express.Router()
const { getLiveTracking } = require('../controllers/mapController')
const { protect, requirePermission } = require('../middleware/auth')

router.use(protect)
router.use(requirePermission('maps'))

router.get('/live-tracking', getLiveTracking)

module.exports = router

const express = require('express')
const router = express.Router()
const { getStats, getRecentData, getChartData } = require('../controllers/dashboardController')
const { protect, requirePermission } = require('../middleware/auth')

router.use(protect)
router.use(requirePermission('dashboard'))

router.get('/stats', getStats)
router.get('/recent', getRecentData)
router.get('/charts', getChartData)

module.exports = router

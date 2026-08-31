const express = require('express')
const router = express.Router()
const c = require('../controllers/pricingConfigController')
const { protect, requireRole } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requireRole('super_admin', 'operations_manager'))

router.get('/', c.getPricingConfig)
router.put('/:category', logAction('Pricing Config', 'Pricing Config Updated', 'settings', 'high'), c.upsertPricingConfig)

module.exports = router

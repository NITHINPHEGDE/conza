const express = require('express')
const router = express.Router()
const c = require('../controllers/pricingController')
const { protect, requireRole } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requireRole('super_admin', 'operations_manager'))

router.get('/', c.getPricing)
router.post('/', logAction('Pricing', 'Pricing Created', 'settings', 'high'), c.createPricing)
router.put('/:id', logAction('Pricing', 'Pricing Updated', 'settings', 'high'), c.updatePricing)
router.delete('/:id', logAction('Pricing', 'Pricing Deleted', 'removal', 'high'), c.deletePricing)

module.exports = router

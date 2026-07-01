const express = require('express')
const router = express.Router()
const c = require('../controllers/vendorController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('vendors'))

router.get('/', c.getVendors)
router.get('/verification', c.getPendingVendors)
router.get('/:id', c.getVendorById)
router.get('/:id/orders', c.getVendorOrders)
router.get('/:id/earnings', c.getVendorEarnings)
router.get('/:id/reviews', c.getVendorReviews)
router.put('/:id/status', logAction('Vendors', 'Vendor Status Updated', 'approval', 'medium'), c.updateVendorStatus)
router.put('/:id/verify', logAction('Vendors', 'Vendor Verified', 'approval', 'medium'), c.verifyVendor)

module.exports = router

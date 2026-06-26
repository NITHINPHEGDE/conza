const express = require('express')
const router = express.Router()
const c = require('../controllers/businessPartnerController')
const { protect, requirePermission } = require('../middleware/auth')

router.use(protect)
router.use(requirePermission('bp'))

router.get('/', c.getBusinessPartners)
router.get('/territories', c.getTerritories)
router.get('/:id', c.getBPById)
router.get('/:id/referrals', c.getBPReferrals)
router.get('/:id/commissions', c.getBPCommissions)
router.put('/:id/status', c.updateBPStatus)

module.exports = router

const express = require('express')
const router = express.Router()
const c = require('../controllers/promotionController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('promotions'))

router.get('/coupons', c.getCoupons)
router.get('/cashback', c.getCashback)
router.get('/referrals', c.getReferrals)
router.get('/seasonal', c.getSeasonalOffers)
router.post('/', logAction('Promotions', 'Promotion Created', 'content', 'low'), c.createPromotion)
router.put('/:id', logAction('Promotions', 'Promotion Updated', 'content', 'low'), c.updatePromotion)
router.delete('/:id', logAction('Promotions', 'Promotion Deleted', 'removal', 'medium'), c.deletePromotion)

module.exports = router

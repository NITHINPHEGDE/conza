const express = require('express')
const router = express.Router()
const c = require('../controllers/financeController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('finance'))

router.get('/revenue', c.getRevenue)
router.get('/transactions', c.getTransactions)
router.get('/payouts', c.getPayouts)
router.put('/payouts/:id/approve', logAction('Finance', 'Payout Approved', 'payout', 'high'), c.approvePayout)
router.get('/reports', c.getReports)
router.get('/commissions', c.getCommissions)

module.exports = router

const express = require('express')
const router = express.Router()
const c = require('../controllers/paymentController')
const { protect, requirePermission } = require('../middleware/auth')

router.use(protect)
router.use(requirePermission('payments'))

router.get('/razorpay', c.getRazorpayPayments)
router.get('/failed', c.getFailedPayments)
router.get('/refunds', c.getRefundRequests)
router.get('/cash', c.getCashPayments)
router.get('/upi', c.getUPIPayments)

module.exports = router

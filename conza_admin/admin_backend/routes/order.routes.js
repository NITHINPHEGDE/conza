const express = require('express')
const router = express.Router()
const c = require('../controllers/orderController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('orders'))

router.get('/', c.getOrders)
router.get('/tracking', c.getOrderTracking)
router.get('/disputes', c.getOrderDisputes)
router.get('/:id', c.getOrderById)
router.put('/:id/status', logAction('Orders', 'Order Status Updated', 'update', 'medium'), c.updateOrderStatus)

module.exports = router

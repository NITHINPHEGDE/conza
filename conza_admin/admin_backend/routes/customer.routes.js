const express = require('express')
const router = express.Router()
const c = require('../controllers/customerController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('customers'))

router.get('/', c.getCustomers)
router.get('/:id', c.getCustomerById)
router.get('/:id/bookings', c.getCustomerBookings)
router.get('/:id/payments', c.getCustomerPayments)
router.get('/:id/complaints', c.getCustomerComplaints)
router.get('/:id/orders', c.getCustomerOrders)
router.put('/:id/status', logAction('Customers', 'Customer Status Updated', 'update', 'medium'), c.updateCustomerStatus)
router.delete('/:id', logAction('Customers', 'Customer Deleted', 'deletion', 'high'), c.deleteCustomer)

module.exports = router
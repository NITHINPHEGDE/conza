const express = require('express')
const router = express.Router()
const c = require('../controllers/bookingController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('bookings'))

router.get('/', c.getBookings)
router.get('/disputes', c.getDisputes)
router.get('/:id', c.getBookingById)
router.get('/:id/timeline', c.getBookingTimeline)
router.put('/:id/status', logAction('Bookings', 'Booking Status Updated', 'update', 'medium'), c.updateBookingStatus)
router.put('/:id/assign', logAction('Bookings', 'Worker Assigned', 'update', 'low'), c.assignWorker)
router.put('/:id/dispute', logAction('Bookings', 'Dispute Resolved', 'dispute', 'high'), c.resolveDispute)

module.exports = router

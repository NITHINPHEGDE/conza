const express = require('express')
const router = express.Router()
const c = require('../controllers/workerController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('workers'))

router.get('/', c.getWorkers)
router.get('/verification', c.getPendingVerifications)
router.get('/:id', c.getWorkerById)
router.get('/:id/bookings', c.getWorkerBookings)
router.get('/:id/earnings', c.getWorkerEarnings)
router.get('/:id/ratings', c.getWorkerRatings)
router.put('/:id/status', logAction('Workers', 'Worker Status Updated', 'suspension', 'high'), c.updateWorkerStatus)
router.put('/:id/verify', logAction('Workers', 'Worker Verified', 'approval', 'medium'), c.verifyWorker)

module.exports = router

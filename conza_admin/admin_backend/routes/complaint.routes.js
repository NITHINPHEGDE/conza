const express = require('express')
const router = express.Router()
const c = require('../controllers/complaintController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('complaints'))

router.get('/', c.getAllComplaints)
router.get('/tickets', c.getTickets)
router.get('/escalations', c.getEscalations)
router.get('/refunds', c.getRefundCases)
router.get('/:id', c.getComplaintById)
router.put('/:id', logAction('Complaints', 'Complaint Updated', 'dispute', 'medium'), c.updateComplaint)

module.exports = router

const express = require('express');
const router = express.Router();
const { createComplaint, getMyComplaints, getComplaintById } = require('../controllers/complaintController');
const { protect, checkSuspended } = require('../middleware/authMiddleware');

router.post('/', protect, checkSuspended, createComplaint);
router.get('/my', protect, getMyComplaints);
router.get('/:id', protect, getComplaintById);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getWorkerRequests, updateBookingStatus, getWorkerHistory, getBookingById } = require('../controllers/bookingController');
const { protect, requireActive } = require('../middleware/auth');

router.get('/requests', protect, requireActive, getWorkerRequests);
router.get('/history', protect, requireActive, getWorkerHistory);
router.get('/:id', protect, requireActive, getBookingById);
router.patch('/:id/status', protect, requireActive, updateBookingStatus);

module.exports = router;

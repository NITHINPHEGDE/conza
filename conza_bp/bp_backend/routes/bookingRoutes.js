const express = require('express');
const router = express.Router();
const { getWorkerRequests, updateBookingStatus, getWorkerHistory, getBookingById } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.get('/requests', protect, getWorkerRequests);
router.get('/history', protect, getWorkerHistory);
router.get('/:id', protect, getBookingById);
router.patch('/:id/status', protect, updateBookingStatus);

module.exports = router;

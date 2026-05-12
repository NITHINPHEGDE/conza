const express = require('express');
const router = express.Router();
const { getWorkerRequests, updateBookingStatus } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.get('/requests', protect, getWorkerRequests);
router.patch('/:id/status', protect, updateBookingStatus);

module.exports = router;

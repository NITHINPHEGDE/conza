const express = require('express');
const router  = express.Router();
const { createBooking, getMyBookings, getBookingById, cancelBooking, confirmCompletion, reportIssue } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',       protect, createBooking);
router.get('/my',      protect, getMyBookings);
router.get('/:id',     protect, getBookingById);
router.patch('/:id/cancel', protect, cancelBooking);
router.patch('/:id/confirm-completion', protect, confirmCompletion);
router.patch('/:id/report-issue', protect, reportIssue);

module.exports = router;
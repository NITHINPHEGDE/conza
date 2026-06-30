const express = require('express');
const router  = express.Router();
const { createBooking, getMyBookings, getBookingById, cancelBooking, confirmCompletion, reportIssue } = require('../controllers/bookingController');
const { protect, checkSuspended } = require('../middleware/authMiddleware');

router.post('/',       protect, checkSuspended, createBooking);
router.get('/my',      protect, getMyBookings);
router.get('/:id',     protect, getBookingById);
router.patch('/:id/cancel', protect, checkSuspended, cancelBooking);
router.patch('/:id/confirm-completion', protect, checkSuspended, confirmCompletion);
router.patch('/:id/report-issue', protect, checkSuspended, reportIssue);

module.exports = router;
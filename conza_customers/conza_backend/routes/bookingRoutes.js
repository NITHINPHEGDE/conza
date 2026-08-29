const express = require('express');
const router  = express.Router();
const { createBooking, createAutobookBooking, getMyBookings, getBookingById, cancelBooking, confirmCompletion, reportIssue, submitReview } = require('../controllers/bookingController');
const { protect, checkSuspended } = require('../middleware/authMiddleware');

router.post('/',       protect, checkSuspended, createBooking);
router.post('/autobook', protect, checkSuspended, createAutobookBooking);
router.get('/my',      protect, getMyBookings);
router.get('/:id',     protect, getBookingById);
router.patch('/:id/cancel', protect, checkSuspended, cancelBooking);
router.patch('/:id/confirm-completion', protect, checkSuspended, confirmCompletion);
router.patch('/:id/report-issue', protect, checkSuspended, reportIssue);
router.patch('/:id/review', protect, checkSuspended, submitReview);

module.exports = router;
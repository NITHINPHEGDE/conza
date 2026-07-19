const express = require('express');
const router  = express.Router();
const { createBooking, createAutoBooking, getMyBookings, getBookingById, cancelBooking, confirmCompletion, reportIssue, confirmPartialAutoBook, cancelPartialAutoBook } = require('../controllers/bookingController');
const { protect, checkSuspended } = require('../middleware/authMiddleware');

router.post('/',       protect, checkSuspended, createBooking);
router.post('/auto',   protect, checkSuspended, createAutoBooking);
router.get('/my',      protect, getMyBookings);
router.get('/:id',     protect, getBookingById);
router.patch('/:id/cancel', protect, checkSuspended, cancelBooking);
router.patch('/:id/confirm-completion', protect, checkSuspended, confirmCompletion);
router.patch('/:id/report-issue',        protect, checkSuspended, reportIssue);
router.patch('/:id/partial-proceed',     protect, checkSuspended, confirmPartialAutoBook);
router.patch('/:id/partial-cancel',      protect, checkSuspended, cancelPartialAutoBook);

module.exports = router;
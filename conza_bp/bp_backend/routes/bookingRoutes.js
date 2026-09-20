const express = require('express');
const router = express.Router();
const { getWorkerRequests, acceptAutobookRequest, updateBookingStatus, getWorkerHistory, getBookingById, getEarningEstimate, markCashCollected } = require('../controllers/bookingController');
const { protect, requireActive } = require('../middleware/auth');

router.get('/requests', protect, requireActive, getWorkerRequests);
router.get('/history', protect, requireActive, getWorkerHistory);
router.get('/:id/earning-estimate', protect, requireActive, getEarningEstimate);
router.get('/:id', protect, requireActive, getBookingById);
router.patch('/:id/accept', protect, requireActive, acceptAutobookRequest);
router.patch('/:id/status', protect, requireActive, updateBookingStatus);
router.patch('/:id/cash-collected', protect, requireActive, markCashCollected);

module.exports = router;

const Booking = require('../models/Booking');

// @desc    Get all pending requests for the logged-in worker
// @route   GET /api/bookings/requests
// @access  Private
const getWorkerRequests = async (req, res) => {
  try {
    const workerId = req.worker._id;

    // Find bookings where this worker is in the workers array AND status is pending
    const requests = await Booking.find({
      workers: workerId,
      status: 'pending'
    })
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Accept/Reject a booking request
// @route   PATCH /api/bookings/:id/status
// @access  Private
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ensure worker is part of this booking
    if (!booking.workers.includes(req.worker._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
    }

    booking.status = status;
    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getWorkerRequests,
  updateBookingStatus
};

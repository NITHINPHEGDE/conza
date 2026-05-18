const Booking = require('../models/Booking');
require('../models/User'); // Register User model for population

// @desc    Get all pending requests for the logged-in worker
// @route   GET /api/bookings/requests
// @access  Private
const getWorkerRequests = async (req, res) => {
  try {
    const workerId = req.worker._id;

    console.log('🔍 Fetching requests for worker:', workerId);
    
    // DEBUG: Let's see if there are ANY pending bookings at all
    const allPending = await Booking.find({ status: 'pending' });
    console.log('🧪 Debug: Total pending bookings in DB:', allPending.length);
    if (allPending.length > 0) {
      console.log('🧪 Debug: First pending booking workers:', allPending[0].workers);
    }

    // Find bookings where this worker is in the workers array AND status is pending
    const requests = await Booking.find({
      workers: workerId,
      status: 'pending'
    })
    .populate('user', 'fullName phone profileImage')
    .sort({ createdAt: -1 });

    console.log('📦 Found', requests.length, 'requests for worker:', workerId);
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
    const isAssigned = booking.workers.some(id => id.toString() === req.worker._id.toString());
    if (!isAssigned) {
      return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
    }

    // Automatically set timestamps based on status
    if (status === 'accepted' && !booking.acceptedAt) {
      booking.acceptedAt = new Date();
    }
    
    if (status === 'arrived' && !booking.checkInTime) {
  booking.checkInTime = new Date();
}
    
    if (status === 'completed' && !booking.checkOutTime) {
      booking.checkOutTime = new Date();
    }

    if (status === 'cancelled') {
      booking.workerCancelled = true;
    }

    booking.status = status;
    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get booking history for the logged-in worker
// @route   GET /api/bookings/history
// @access  Private
const getWorkerHistory = async (req, res) => {
  try {
    const workerId = req.worker._id;

    // Find bookings where this worker is in the workers array AND status is terminal (completed/cancelled)
    const history = await Booking.find({
      workers: workerId,
      status: { $in: ['completed', 'cancelled'] }
    })
    .populate('user', 'fullName phone profileImage')
    .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: history.length,
      history
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'fullName phone profileImage');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getWorkerRequests,
  updateBookingStatus,
  getWorkerHistory,
  getBookingById
};

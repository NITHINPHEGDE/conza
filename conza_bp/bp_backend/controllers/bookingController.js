const Booking = require('../models/Booking');
const Worker  = require('../models/Worker');
const logger  = require('../utils/logger');
const { withCache, invalidateCache } = require('../utils/cacheHelpers');
require('../models/User');

const getWorkerRequests = async (req, res) => {
  try {
    const workerId = req.worker._id.toString();
    const cacheKey = `bp:worker:${workerId}:requests:pending`;
    const TTL      = 15; // seconds — short so new bookings appear fast

    const requests = await withCache(cacheKey, TTL, () =>
      Booking.find({ workers: workerId, status: 'pending' })
        .populate('user', 'fullName phone profileImage')
        .sort({ createdAt: -1 })
        .lean()
    );

    logger.info({ workerId, count: requests.length }, 'Fetched worker requests');
    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    logger.error({ err }, 'getWorkerRequests failed');
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId  = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isAssigned = booking.workers.some(id => id.toString() === req.worker._id.toString());
    if (!isAssigned) {
      return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
    }

    if (status === 'accepted'  && !booking.acceptedAt)   booking.acceptedAt   = new Date();
    if (status === 'arrived'   && !booking.checkInTime)   booking.checkInTime  = new Date();
    if (status === 'completed' && !booking.checkOutTime) {
      booking.checkOutTime = new Date();
      if (req.body.paymentMethod) booking.paymentMethod = req.body.paymentMethod;
    }
    if (status === 'cancelled') booking.workerCancelled = true;

    booking.status = status;
    await booking.save();

    if (status === 'accepted') {
      await Worker.updateMany({ _id: { $in: booking.workers } }, { isAvailable: false });
    }
    if (status === 'completed' || status === 'cancelled') {
      await Worker.updateMany({ _id: { $in: booking.workers } }, { isAvailable: true });
    }

    // Invalidate affected worker caches
    await Promise.allSettled(
      booking.workers.map((wId) =>
        invalidateCache(
          `bp:worker:${wId}:requests:pending`,
          `bp:worker:${wId}:history`,
          `bp:booking:${bookingId}`
        )
      )
    );

    logger.info({ bookingId, status }, 'Booking status updated');
    res.json({ success: true, booking });
  } catch (err) {
    logger.error({ err }, 'updateBookingStatus failed');
    res.status(500).json({ success: false, message: err.message });
  }
};

const getWorkerHistory = async (req, res) => {
  try {
    const workerId = req.worker._id.toString();
    const cacheKey = `bp:worker:${workerId}:history`;
    const TTL      = 120; // 2 min — history doesn't change often

    const history = await withCache(cacheKey, TTL, () =>
      Booking.find({ workers: workerId, status: { $in: ['completed', 'cancelled'] } })
        .populate('user', 'fullName phone profileImage')
        .sort({ updatedAt: -1 })
        .lean()
    );

    res.json({ success: true, count: history.length, history });
  } catch (err) {
    logger.error({ err }, 'getWorkerHistory failed');
    res.status(500).json({ success: false, message: err.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const cacheKey  = `bp:booking:${bookingId}`;
    const TTL       = 30;

    const booking = await withCache(cacheKey, TTL, () =>
      Booking.findById(bookingId)
        .populate('user', 'fullName phone profileImage')
        .lean()
    );

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (err) {
    logger.error({ err }, 'getBookingById failed');
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getWorkerRequests, updateBookingStatus, getWorkerHistory, getBookingById };
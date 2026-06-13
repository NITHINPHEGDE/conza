const Booking = require('../models/Booking');
const Worker  = require('../models/Worker');
const logger  = require('../utils/logger');
const { withCache, invalidateCache } = require('../utils/cacheHelpers');
require('../models/User');

// ── GET /api/bookings/requests ────────────────────────────────────────────
const getWorkerRequests = async (req, res) => {
  try {
    const workerId = req.worker._id.toString();
    const { page = 1, limit = 20 } = req.query;
    const skip     = (Number(page) - 1) * Number(limit);
    const cacheKey = `bp:worker:${workerId}:requests:pending:${page}:${limit}`;
    const TTL      = 15;

    const result = await withCache(cacheKey, TTL, async () => {
      const [requests, total] = await Promise.all([
        Booking.find({ workers: workerId, status: 'pending' })
          .populate('user', 'fullName phone profileImage')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Booking.countDocuments({ workers: workerId, status: 'pending' }),
      ]);
      return { requests, total };
    });

    logger.info({ workerId, count: result.requests.length }, 'Fetched worker requests');
    res.json({
      success: true,
      count:   result.requests.length,
      total:   result.total,
      page:    Number(page),
      pages:   Math.ceil(result.total / Number(limit)),
      requests: result.requests,
    });
  } catch (err) {
    logger.error({ err }, 'getWorkerRequests failed');
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/bookings/:id/status ───────────────────────────────────────
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
    if (status === 'awaiting_customer_confirmation' && !booking.checkOutTime) {
      booking.checkOutTime = new Date(); // Tentative
      if (req.body.paymentMethod) booking.paymentMethod = req.body.paymentMethod;
    }
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

    // Emit socket event to customer for confirmation
    if (status === 'awaiting_customer_confirmation') {
      try {
        const { getIO } = require('../services/socketService');
        const io = getIO();
        io.to(`customer_${booking.user}`).emit('work_completion_requested', { bookingId });
        io.to(`booking_${bookingId}`).emit('work_completion_requested', { bookingId });
        // Also emit standard status change
        io.to(`booking_${bookingId}`).emit('booking_status_changed', { bookingId, status });
      } catch (err) {
        logger.error({ err }, 'Failed to emit work_completion_requested');
      }
    }

    // Emit standard booking_updated + booking_status_changed for all workflow transitions
    // so the customer app (joined to customer_{userId} and booking_{id} rooms) updates instantly
    if (['accepted', 'arrived', 'in_progress', 'cancelled'].includes(status)) {
      try {
        const { getIO } = require('../services/socketService');
        const io = getIO();
        // Notify customer's personal room (StatusScreen list updates)
        io.to(`customer_${booking.user}`).emit('booking_updated', {
          operationType: 'update',
          bookingId,
          status,
        });
        // Notify booking detail room (BookingTrackingScreen updates)
        io.to(`booking_${bookingId}`).emit('booking_status_changed', {
          bookingId,
          status,
        });
      } catch (err) {
        logger.error({ err }, 'Failed to emit booking status event');
      }
    }

    // Invalidate all paginated request/history cache pages for affected workers
    await Promise.allSettled(
      booking.workers.map((wId) =>
        invalidateCache(
          `bp:worker:${wId}:requests:pending:*`,
          `bp:worker:${wId}:history:*`,
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

// ── GET /api/bookings/history ─────────────────────────────────────────────
const getWorkerHistory = async (req, res) => {
  try {
    const workerId = req.worker._id.toString();
    const { page = 1, limit = 20 } = req.query;
    const skip     = (Number(page) - 1) * Number(limit);
    const cacheKey = `bp:worker:${workerId}:history:${page}:${limit}`;
    const TTL      = 120;

    const result = await withCache(cacheKey, TTL, async () => {
      const [history, total] = await Promise.all([
        Booking.find({ workers: workerId, status: { $in: ['completed', 'cancelled'] } })
          .populate('user', 'fullName phone profileImage')
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Booking.countDocuments({ workers: workerId, status: { $in: ['completed', 'cancelled'] } }),
      ]);
      return { history, total };
    });

    res.json({
      success: true,
      count:   result.history.length,
      total:   result.total,
      page:    Number(page),
      pages:   Math.ceil(result.total / Number(limit)),
      history: result.history,
    });
  } catch (err) {
    logger.error({ err }, 'getWorkerHistory failed');
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bookings/:id ─────────────────────────────────────────────────
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
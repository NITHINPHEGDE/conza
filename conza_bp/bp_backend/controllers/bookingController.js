const Booking = require('../models/Booking');
const Worker  = require('../models/Worker');
const logger  = require('../utils/logger');
const { withCache, invalidateCache } = require('../utils/cacheHelpers');
const { getDistanceInMeters } = require('../utils/geoUtils');
const { calculateHourlyCharge } = require('../utils/billingUtils');
require('../models/User');

const ARRIVAL_RADIUS_METERS = 50;

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
        Booking.find({ workers: workerId, status: 'pending', declinedWorkers: { $ne: workerId } })
          .populate('user', 'fullName phone profileImage')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Booking.countDocuments({ workers: workerId, status: 'pending', declinedWorkers: { $ne: workerId } }),
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

// ── Quick Auto Book: atomic per-worker accept ──────────────────────────────
// Many workers can hit this within milliseconds of each other. The $expr
// size-guard makes the push atomic per document in MongoDB — only the first
// `requiredWorkers` callers succeed; everyone else gets a clean 409 instead
// of silently over-filling the booking.
const handleAutoBookAccept = async (req, res, booking) => {
  try {
    const workerId = req.worker._id;

    const updated = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        autoBookStatus: 'broadcasting',
        acceptedWorkers: { $ne: workerId },
        $expr: { $lt: [{ $size: '$acceptedWorkers' }, '$requiredWorkers'] },
      },
      {
        $push: { acceptedWorkers: workerId },
        $set:  { acceptedAt: booking.acceptedAt || new Date() },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'This request has just been filled by other workers. Better luck next time!',
      });
    }

    let finalBooking = updated;
    const isFulfilled = updated.acceptedWorkers.length >= updated.requiredWorkers;

    if (isFulfilled) {
      const acceptedWorkerDocs = await Worker.find({ _id: { $in: updated.acceptedWorkers } })
        .select('fullName minCharge baseCharge perDayCharge rating').lean();

      const workerSnapshot = acceptedWorkerDocs.map(w => ({
        _id:          w._id,
        name:         w.fullName,
        pricePerDay:  w.minCharge || 0,
        minCharge:    w.minCharge,
        baseCharge:   w.baseCharge,
        perDayCharge: w.perDayCharge,
        rating:       w.rating,
      }));
      const subtotal = updated.isImmediate
        ? workerSnapshot.reduce((s, w) => s + (Number(w.pricePerDay) || 0), 0)
        : workerSnapshot.reduce((s, w) => s + ((Number(w.perDayCharge) || Number(w.pricePerDay) || 0) * (updated.totalDays || 1)), 0);
      const platformFee = Math.round(subtotal * 0.05);

      finalBooking = await Booking.findOneAndUpdate(
        { _id: booking._id, autoBookStatus: 'broadcasting' },
        {
          $set: {
            autoBookStatus: 'fulfilled',
            status:         'accepted',
            acceptedAt:     updated.acceptedAt || new Date(),
            workers:        updated.acceptedWorkers,
            workerSnapshot,
            subtotal, platformFee, total: subtotal + platformFee,
          },
        },
        { new: true }
      ) || updated;

      await Worker.updateMany({ _id: { $in: finalBooking.acceptedWorkers } }, { isAvailable: false });

      const closedFor = (booking.workers || []).filter(
        wId => !finalBooking.acceptedWorkers.some(a => a.toString() === wId.toString())
      );

      try {
        const { getIO } = require('../services/socketService');
        const io = getIO();
        closedFor.forEach(wId =>
          io.to(`worker_${wId}`).emit('autobook_request_closed', { bookingId: booking._id.toString() })
        );
        finalBooking.acceptedWorkers.forEach(wId =>
          io.to(`worker_${wId}`).emit('autobook_confirmed', { bookingId: booking._id.toString() })
        );
        io.to(`customer_${booking.user}`).emit('booking_updated', {
          operationType: 'update', bookingId: booking._id.toString(), status: 'accepted',
        });
        io.to(`booking_${booking._id}`).emit('booking_status_changed', {
          bookingId: booking._id.toString(), status: 'accepted',
        });
      } catch (err) {
        logger.error({ err }, 'Failed to emit autobook fulfilment events');
      }
    } else {
      try {
        const { getIO } = require('../services/socketService');
        const io = getIO();
        io.to(`customer_${booking.user}`).emit('autobook_progress', {
          bookingId: booking._id.toString(),
          accepted:  updated.acceptedWorkers.length,
          required:  updated.requiredWorkers,
        });
        io.to(`booking_${booking._id}`).emit('autobook_progress', {
          bookingId: booking._id.toString(),
          accepted:  updated.acceptedWorkers.length,
          required:  updated.requiredWorkers,
        });
      } catch (_) {}
    }

    await Promise.allSettled(
      (booking.workers || []).map((wId) =>
        invalidateCache(
          `bp:worker:${wId}:requests:pending:*`,
          `bp:worker:${wId}:history:*`,
          `bp:booking:${booking._id}`
        )
      )
    );
    await invalidateCache(
      `bookings:user:${booking.user}:*`,
      `bookings:detail:${booking._id}`
    ).catch(() => {});

    logger.info({ bookingId: booking._id, workerId, isFulfilled }, 'Autobook accept processed');
    res.json({ success: true, booking: finalBooking, autoBookFulfilled: isFulfilled });
  } catch (err) {
    logger.error({ err }, 'handleAutoBookAccept failed');
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Quick Auto Book: decline only removes the request for THIS worker ──────
// The booking stays open for everyone else. If every broadcast worker ends
// up declining before enough acceptances come in, the request is closed out
// so it doesn't sit "pending" forever with no one left to fulfil it.
const handleAutoBookDecline = async (req, res, booking) => {
  try {
    const workerId = req.worker._id;

    await Booking.updateOne(
      { _id: booking._id },
      { $addToSet: { declinedWorkers: workerId } }
    );

    const fresh = await Booking.findById(booking._id)
      .select('workers acceptedWorkers declinedWorkers requiredWorkers user autoBookStatus status');

    if (
      fresh &&
      fresh.autoBookStatus === 'broadcasting' &&
      fresh.acceptedWorkers.length < fresh.requiredWorkers &&
      fresh.declinedWorkers.length >= fresh.workers.length
    ) {
      fresh.status = 'cancelled';
      fresh.autoBookStatus = 'cancelled';
      await fresh.save();

      try {
        const { getIO } = require('../services/socketService');
        const io = getIO();
        io.to(`customer_${fresh.user}`).emit('booking_updated', {
          operationType: 'update', bookingId: fresh._id.toString(), status: 'cancelled',
        });
        io.to(`booking_${fresh._id}`).emit('booking_status_changed', {
          bookingId: fresh._id.toString(), status: 'cancelled',
        });
      } catch (_) {}
    }

    await invalidateCache(
      `bp:worker:${workerId}:requests:pending:*`,
      `bp:booking:${booking._id}`
    ).catch(() => {});

    res.json({ success: true, declined: true });
  } catch (err) {
    logger.error({ err }, 'handleAutoBookDecline failed');
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

    // ── Quick Auto Book: accept/decline are per-worker while broadcasting,
    // not a whole-booking status flip like the normal single-assignment flow.
    if (booking.isAutoBook && booking.autoBookStatus === 'broadcasting') {
      if (status === 'accepted')  return handleAutoBookAccept(req, res, booking);
      if (status === 'cancelled') return handleAutoBookDecline(req, res, booking);
    }

    if (status === 'accepted'  && !booking.acceptedAt)   booking.acceptedAt   = new Date();

    // "Mark as Arrived" is only allowed within 50m of the customer's saved location
    if (status === 'arrived' && !booking.checkInTime) {
      const { latitude, longitude } = req.body;
      if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
        return res.status(400).json({
          success: false,
          message: 'Your current location is required to mark yourself as arrived.',
        });
      }
      if (booking.latitude != null && booking.longitude != null) {
        const distance = getDistanceInMeters(
          Number(latitude), Number(longitude),
          booking.latitude, booking.longitude
        );
        if (distance > ARRIVAL_RADIUS_METERS) {
          return res.status(403).json({
            success: false,
            message: `You must be within ${ARRIVAL_RADIUS_METERS}m of the customer's location to mark as arrived. You are currently ~${Math.round(distance)}m away.`,
          });
        }
      }
      booking.checkInTime = new Date();
    }

    // Work timer starts here — hourly billing is calculated from this point
    if (status === 'in_progress' && !booking.workStartTime) {
      booking.workStartTime = new Date();
      if (!booking.hourlyRate) {
        booking.hourlyRate = (booking.workerSnapshot || []).reduce(
          (sum, w) => sum + (Number(w.pricePerDay) || Number(w.minCharge) || 0), 0
        );
      }
    }

    if (status === 'awaiting_customer_confirmation' && !booking.checkOutTime) {
      booking.checkOutTime = new Date(); // Tentative
      if (req.body.paymentMethod) booking.paymentMethod = req.body.paymentMethod;
    }
    if (status === 'completed' && !booking.checkOutTime) {
      booking.checkOutTime = new Date();
      if (req.body.paymentMethod) booking.paymentMethod = req.body.paymentMethod;
    }

    // Immediate labour bookings are billed by the hour, tiered in 30-min
    // increments, computed once from workStartTime → checkOutTime.
    // Exception: if work is ≤ 1 hour, the combined baseCharge is applied
    // instead of the hourly rate (minimum call-out fee).
    if (
      ['awaiting_customer_confirmation', 'completed'].includes(status) &&
      booking.isImmediate &&
      booking.bookingType === 'labour' &&
      booking.workStartTime &&
      booking.hoursWorked == null
    ) {
      const hourlyRate = booking.hourlyRate || (booking.workerSnapshot || []).reduce(
        (sum, w) => sum + (Number(w.pricePerDay) || 0), 0
      );
      // Sum each worker's baseCharge for sub-1-hour billing
      const combinedBaseCharge = (booking.workerSnapshot || []).reduce(
        (sum, w) => sum + (Number(w.baseCharge) || 0), 0
      );
      const { billedHours, subtotal, baseFeeApplied } = calculateHourlyCharge(
        booking.workStartTime, booking.checkOutTime, hourlyRate, combinedBaseCharge
      );
      const platformFee = Math.round(subtotal * 0.05);

      booking.hoursWorked    = billedHours;
      booking.hourlyRate     = hourlyRate;
      booking.subtotal       = subtotal;
      booking.platformFee    = platformFee;
      booking.total          = subtotal + platformFee;
      booking.baseFeeApplied = baseFeeApplied;
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

    // Invalidate worker-side cache (BP backend)
    await Promise.allSettled(
      booking.workers.map((wId) =>
        invalidateCache(
          `bp:worker:${wId}:requests:pending:*`,
          `bp:worker:${wId}:history:*`,
          `bp:booking:${bookingId}`
        )
      )
    );

    // Invalidate customer-side cache so fetchActiveBookings() returns
    // fresh status instead of serving the stale cached value
    await invalidateCache(
      `bookings:user:${booking.user}:*`,
      `bookings:detail:${bookingId}`
    ).catch(() => {});

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
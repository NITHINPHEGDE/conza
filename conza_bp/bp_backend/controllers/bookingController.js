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

    // Manual bookings: worker is directly in `workers`.
    // Auto-book requests: worker is in the broadcast pool (`requestedWorkerIds`)
    // but hasn't yet claimed a slot in `workers` — once they do (or the quota
    // fills), this query stops returning it for everyone.
    const query = {
      status: 'pending',
      $or: [
        { isAutoBook: { $ne: true }, workers: workerId },
        { isAutoBook: true, requestedWorkerIds: workerId, workers: { $ne: workerId } },
      ],
    };

    const result = await withCache(cacheKey, TTL, async () => {
      const [requests, total] = await Promise.all([
        Booking.find(query)
          .populate('user', 'fullName phone profileImage')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Booking.countDocuments(query),
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

    const booking  = await Booking.findById(bookingId);
    const workerId = req.worker._id.toString();
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // ── Auto-book acceptance — atomic first-come-first-served slot claim ────
    if (booking.isAutoBook && status === 'accepted') {
      const isRequested = (booking.requestedWorkerIds || []).some(id => id.toString() === workerId);
      if (!isRequested) {
        return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
      }

      // Atomically claim a slot only if:
      //   • booking is still pending (accepting new workers)
      //   • this worker hasn't already claimed a slot
      //   • the required number of workers hasn't been reached yet
      const claimed = await Booking.findOneAndUpdate(
        {
          _id:    bookingId,
          status: 'pending',
          workers: { $ne: workerId },
          $expr:  { $lt: [{ $size: '$workers' }, '$requiredWorkers'] },
        },
        {
          $addToSet: { workers: workerId },
          $push: {
            workerSnapshot: {
              _id:          req.worker._id,
              name:         req.worker.fullName,
              pricePerDay:  req.worker.minCharge   || 0,
              perDayCharge: req.worker.perDayCharge || 0,
              baseCharge:   req.worker.baseCharge   || 0,
            },
          },
          $set: { acceptedAt: booking.acceptedAt || new Date() },
        },
        { new: true }
      );

      if (!claimed) {
        return res.status(409).json({ success: false, message: 'This job has already been filled by other workers' });
      }

      // Mark this specific worker unavailable immediately.
      await Worker.findByIdAndUpdate(workerId, { isAvailable: false });

      let finalBooking = claimed;

      // Once the full quota is reached, close the booking (flip to 'accepted')
      // so remaining workers stop seeing it, and compute final pricing.
      if (claimed.workers.length >= claimed.requiredWorkers) {
        const isMultiDay = !claimed.isImmediate && claimed.totalDays && claimed.totalDays > 1;
        const subtotal = (claimed.workerSnapshot || []).reduce((sum, w) => {
          const rate = isMultiDay
            ? (Number(w.perDayCharge) || Number(w.pricePerDay) || 0) * claimed.totalDays
            : (Number(w.pricePerDay) || 0);
          return sum + rate;
        }, 0);
        const platformFee = Math.round(subtotal * 0.05);

        finalBooking = await Booking.findByIdAndUpdate(
          bookingId,
          { status: 'accepted', subtotal, platformFee, total: subtotal + platformFee },
          { new: true }
        );
      }

      await Promise.allSettled(
        (booking.requestedWorkerIds || []).map((wId) =>
          invalidateCache(
            `bp:worker:${wId}:requests:pending:*`,
            `bp:booking:${bookingId}`
          )
        )
      );
      await invalidateCache(
        `bookings:user:${booking.user}:*`,
        `bookings:detail:${bookingId}`
      ).catch(() => {});

      logger.info({ bookingId, workerId, totalAccepted: claimed.workers.length, required: claimed.requiredWorkers }, 'Auto-book slot claimed — worker starting independently');

      // Always return status: 'accepted' to this worker so the frontend
      // immediately navigates them to the ActiveJob flow without waiting.
      return res.json({
        success: true,
        booking: { ...finalBooking.toObject(), status: 'accepted' },
      });
    }

    // ── Auto-book decline — worker drops out of the broadcast pool ────────────
    // Pull this worker from requestedWorkerIds, then check whether everyone
    // has now responded (either accepted into workers[] or declined/removed).
    // If so and quota is not met, notify the customer intelligently.
    if (booking.isAutoBook && status === 'cancelled' && booking.status === 'pending') {
      const isRequested = (booking.requestedWorkerIds || []).some(id => id.toString() === workerId);
      if (!isRequested) {
        return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
      }

      const updated = await Booking.findByIdAndUpdate(
        bookingId,
        { $pull: { requestedWorkerIds: workerId } },
        { new: true }
      );
      await invalidateCache(`bp:worker:${workerId}:requests:pending:*`).catch(() => {});

      // ── Check if everyone has responded ──────────────────────────────────────
      // requestedWorkerIds now only contains workers who HAVEN'T responded yet.
      // Workers who accepted were $addToSet'd to workers[] but stay in requestedWorkerIds.
      // Workers who declined are $pull'd from requestedWorkerIds entirely.
      // So: unresponded = those in requestedWorkerIds who are NOT yet in workers[].
      const acceptedIds  = new Set((updated.workers || []).map(id => id.toString()));
      const unresponded  = (updated.requestedWorkerIds || []).filter(id => !acceptedIds.has(id.toString()));
      const acceptedCount = acceptedIds.size;
      const required      = updated.requiredWorkers || 1;

      if (unresponded.length === 0 && acceptedCount < required) {
        // Everyone has responded and the quota is not met.
        const { getIO } = require('../services/socketService');
        const io = getIO();

        if (acceptedCount === 0) {
          // ── CASE 1: Zero workers accepted — auto-cancel the booking ─────
          await Booking.findByIdAndUpdate(bookingId, {
            status: 'cancelled',
            cancellationReason: 'no_workers_available',
          });
          await invalidateCache(
            `bookings:user:${updated.user}:*`,
            `bookings:detail:${bookingId}`
          ).catch(() => {});

          io.to(`customer_${updated.user}`).emit('autobook_failed', {
            bookingId,
            message: `No ${updated.category || 'workers'} were available nearby. Your request has been cancelled automatically.`,
          });
          logger.info({ bookingId }, 'Auto-book auto-cancelled — zero workers accepted');

        } else {
          // ── CASE 2: Partial match — ask the customer what they want to do ──
          // Mark the booking so it waits for customer decision.
          await Booking.findByIdAndUpdate(bookingId, {
            autoBookStatus: 'partial',
          });
          await invalidateCache(
            `bookings:user:${updated.user}:*`,
            `bookings:detail:${bookingId}`
          ).catch(() => {});

          io.to(`customer_${updated.user}`).emit('autobook_partial', {
            bookingId,
            acceptedCount,
            required,
            category: updated.category || 'worker',
            message: `Only ${acceptedCount} of ${required} ${updated.category || 'workers'} accepted. Proceed with ${acceptedCount}, or cancel?`,
          });
          logger.info({ bookingId, acceptedCount, required }, 'Auto-book partial match — awaiting customer decision');
        }
      }

      return res.json({ success: true, declined: true, booking: updated });
    }

    const isAssigned = booking.workers.some(id => id.toString() === workerId);
    if (!isAssigned) {
      return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
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
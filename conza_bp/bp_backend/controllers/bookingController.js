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
    const workerObjId = req.worker._id;
    const query = {
      status: 'pending',
      $or: [
        { isAutoBook: { $ne: true }, workers: workerObjId },
        { isAutoBook: true, requestedWorkerIds: workerObjId, workers: { $ne: workerObjId } },
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
            workerStatuses: {
              worker:     req.worker._id,
              status:     'accepted',
              acceptedAt: new Date(),
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

      // Notify the customer about acceptance progress in real-time.
      // Fires for EVERY slot claim so the customer sees a live count.
      try {
        const { getIO } = require('../services/socketService');
        const io = getIO();
        io.to(`customer_${booking.user}`).emit('autobook_progress', {
          bookingId:       booking._id.toString(),
          acceptedCount:   claimed.workers.length,
          requiredWorkers: claimed.requiredWorkers,
          category:        booking.category || 'workers',
        });
        io.to(`booking_${booking._id}`).emit('autobook_progress', {
          bookingId:       booking._id.toString(),
          acceptedCount:   claimed.workers.length,
          requiredWorkers: claimed.requiredWorkers,
          category:        booking.category || 'workers',
        });
      } catch (err) {
        logger.error({ err }, 'Failed to emit autobook_progress');
      }

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

        // Immediately notify all non-accepted workers in the broadcast pool
        // that this request is no longer available so they see it vanish
        // right away instead of waiting for the async change stream.
        try {
          const { getIO } = require('../services/socketService');
          const io = getIO();
          const acceptedSet = new Set((claimed.workers || []).map(id => id.toString()));
          (booking.requestedWorkerIds || [])
            .filter(id => !acceptedSet.has(id.toString()))
            .forEach(id => {
              io.to(`worker_${id}`).emit('job_request_removed', { bookingId });
            });
        } catch (err) {
          logger.error({ err }, 'Failed to emit job_request_removed on quota fill');
        }
      }

      await Promise.allSettled(
        (booking.requestedWorkerIds || []).map((wId) =>
          invalidateCache(
            `bp:worker:${wId}:requests:pending:*`,
            `bp:booking:${bookingId}:*`
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
        booking: { ...finalBooking.toObject(), myStatus: 'accepted' },
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

      // Notify customer of acceptance progress on every decline too.
      // This keeps the customer's popup in sync — e.g. "1/3 accepted" →
      // a worker declines → customer sees the updated count.
      try {
        const { getIO } = require('../services/socketService');
        const io = getIO();
        io.to(`customer_${updated.user}`).emit('autobook_progress', {
          bookingId,
          acceptedCount,
          required,
          category: updated.category || 'workers',
        });
        io.to(`booking_${bookingId}`).emit('autobook_progress', {
          bookingId,
          acceptedCount,
          required,
          category: updated.category || 'workers',
        });
      } catch (err) {
        logger.error({ err }, 'Failed to emit autobook_progress on decline');
      }

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

    // ── Update per-worker status in workerStatuses array ─────────────────────
    if (!booking.workerStatuses) booking.workerStatuses = [];
    let ws = booking.workerStatuses.find(w => w.worker && w.worker.toString() === workerId);
    if (!ws) {
      booking.workerStatuses.push({
        worker: req.worker._id,
        status: status,
        acceptedAt: booking.acceptedAt || new Date(),
      });
      ws = booking.workerStatuses[booking.workerStatuses.length - 1];
    } else {
      ws.status = status;
    }

    if (status === 'accepted' && !ws.acceptedAt) {
      ws.acceptedAt = new Date();
    }

    // "Mark as Arrived" is only allowed within 50m of the customer's saved location
    if (status === 'arrived' && !ws.checkInTime) {
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
      ws.checkInTime = new Date();
      if (!booking.checkInTime) booking.checkInTime = ws.checkInTime;
    }

    // Work timer starts here — hourly billing is calculated from this point
    if (status === 'in_progress' && !ws.workStartTime) {
      ws.workStartTime = new Date();
      if (!booking.workStartTime) booking.workStartTime = ws.workStartTime;
      if (!booking.hourlyRate) {
        booking.hourlyRate = (booking.workerSnapshot || []).reduce(
          (sum, w) => sum + (Number(w.pricePerDay) || Number(w.minCharge) || 0), 0
        );
      }
    }

    if (status === 'awaiting_customer_confirmation' && !ws.checkOutTime) {
      ws.checkOutTime = new Date();
      if (!booking.checkOutTime) booking.checkOutTime = ws.checkOutTime;
      if (req.body.paymentMethod) booking.paymentMethod = req.body.paymentMethod;
    }
    if (status === 'completed' && !ws.checkOutTime) {
      ws.checkOutTime = new Date();
      if (!booking.checkOutTime) booking.checkOutTime = ws.checkOutTime;
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

    // ── Calculate overall booking.status safely ──────────────────────────────
    // If auto-book is STILL accepting workers, keep overall status as 'pending'
    // so remaining workers can still see & accept open slots!
    if (booking.isAutoBook && (booking.workers || []).length < (booking.requiredWorkers || 1)) {
      booking.status = 'pending';
    } else {
      const allWs = booking.workerStatuses || [];
      const totalAssigned = (booking.workers || []).length;
      if (status === 'cancelled') {
        booking.status = 'cancelled';
      } else if (allWs.length >= totalAssigned && allWs.every(w => w.status === 'completed')) {
        booking.status = 'completed';
      } else if (allWs.length >= totalAssigned && allWs.every(w => w.status === 'awaiting_customer_confirmation' || w.status === 'completed')) {
        booking.status = 'awaiting_customer_confirmation';
      } else if (allWs.some(w => w.status === 'in_progress' || w.status === 'awaiting_customer_confirmation' || w.status === 'completed')) {
        booking.status = 'in_progress';
      } else if (allWs.some(w => w.status === 'arrived')) {
        booking.status = 'arrived';
      } else {
        booking.status = 'accepted';
      }
    }

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
        io.to(`booking_${bookingId}`).emit('booking_status_changed', {
          bookingId,
          workerId,
          workerStatus: status,
          status: booking.status,
        });
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

        // Minimal snapshot so BP workers can tell if this is an auto-book
        // and avoid overriding another worker's personal stage (Bug 2 fix).
        const minSnapshot = {
          isAutoBook: booking.isAutoBook || false,
          workers:    (booking.workers || []).map(id => id.toString()),
        };

        // Notify customer's personal room (StatusScreen list updates)
        io.to(`customer_${booking.user}`).emit('booking_updated', {
          operationType:   'update',
          bookingId,
          status:          booking.status,
          bookingSnapshot: minSnapshot,
        });
        // Notify booking detail room (BookingTrackingScreen updates)
        io.to(`booking_${bookingId}`).emit('booking_status_changed', {
          bookingId,
          workerId,
          workerStatus: status,
          status: booking.status,
          bookingSnapshot: minSnapshot,
        });

        // For auto-book bookings transitioning away from 'pending', notify all
        // non-accepted workers in the broadcast pool that the request is gone
        // so they don't keep seeing a stale card until cache expires.
        if (booking.isAutoBook && booking.status !== 'pending' && status !== 'pending') {
          const acceptedSet = new Set((booking.workers || []).map(id => id.toString()));
          (booking.requestedWorkerIds || [])
            .filter(id => !acceptedSet.has(id.toString()))
            .forEach(id => {
              io.to(`worker_${id}`).emit('job_request_removed', { bookingId });
            });
        }
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
          `bp:booking:${bookingId}:*`
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
        Booking.find({ workers: req.worker._id, status: { $in: ['completed', 'cancelled'] } })
          .populate('user', 'fullName phone profileImage')
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Booking.countDocuments({ workers: req.worker._id, status: { $in: ['completed', 'cancelled'] } }),
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
    const workerId  = req.worker?._id?.toString();
    const cacheKey  = `bp:booking:${bookingId}:worker:${workerId || 'anon'}`;
    const TTL       = 30;

    const booking = await withCache(cacheKey, TTL, () =>
      Booking.findById(bookingId)
        .populate('user', 'fullName phone profileImage')
        .lean()
    );

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    let myStatus;
    if (workerId) {
      const ws = (booking.workerStatuses || []).find(
        w => w.worker && (w.worker._id || w.worker).toString() === workerId
      );
      if (ws) {
        myStatus = ws.status;
      } else if ((booking.workers || []).some(id => (id._id || id).toString() === workerId)) {
        myStatus = 'accepted';
      } else {
        myStatus = booking.status;
      }
    } else {
      myStatus = booking.status;
    }

    res.json({ success: true, booking: { ...booking, myStatus } });
  } catch (err) {
    logger.error({ err }, 'getBookingById failed');
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getWorkerRequests, updateBookingStatus, getWorkerHistory, getBookingById };
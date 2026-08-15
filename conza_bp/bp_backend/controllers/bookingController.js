const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Worker  = require('../models/Worker');
const logger  = require('../utils/logger');
const { withCache, invalidateCache } = require('../utils/cacheHelpers');
const { getDistanceInMeters } = require('../utils/geoUtils');
const { calculateHourlyCharge } = require('../utils/billingUtils');
require('../models/User');

const ARRIVAL_RADIUS_METERS = 50;
const ACTIVE_WORKER_STATUSES = ['accepted', 'arrived', 'in_progress', 'awaiting_customer_confirmation', 'completed'];

// ── GET /api/bookings/requests ────────────────────────────────────────────
const getWorkerRequests = async (req, res) => {
  try {
    const workerId = req.worker._id.toString();
    const { page = 1, limit = 20 } = req.query;
    const skip     = (Number(page) - 1) * Number(limit);
    const cacheKey = `bp:worker:${workerId}:requests:pending:${page}:${limit}`;
    const TTL      = 15;

    const result = await withCache(cacheKey, TTL, async () => {
      const query = {
        $or: [
          { workers: workerId, status: 'pending', isAutobook: { $ne: true } },
          { isAutobook: true, workerStatuses: { $elemMatch: { worker: workerId, status: 'pending' } } },
        ],
      };

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

    // Annotate autobook requests with live accepted-count so the app can
    // show "X of Y needed" and know if it's still worth showing.
    const annotated = result.requests.map((r) => {
      if (!r.isAutobook) return r;
      const acceptedCount = (r.workerStatuses || []).filter((w) => ACTIVE_WORKER_STATUSES.includes(w.status)).length;
      return { ...r, acceptedCount };
    });

    logger.info({ workerId, count: annotated.length }, 'Fetched worker requests');
    res.json({
      success: true,
      count:   annotated.length,
      total:   result.total,
      page:    Number(page),
      pages:   Math.ceil(result.total / Number(limit)),
      requests: annotated,
    });
  } catch (err) {
    logger.error({ err }, 'getWorkerRequests failed');
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/bookings/:id/accept ────────────────────────────────────────
// Autobook only. Atomically flips this worker's own workerStatuses entry
// from 'pending' → 'accepted', but ONLY if the required headcount hasn't
// already been reached — the $expr guard + single-document atomicity in
// MongoDB is what prevents more than `requiredWorkers` from winning the race.
const acceptAutobookRequest = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const workerId  = new mongoose.Types.ObjectId(req.worker._id);

    const updated = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        isAutobook: true,
        status: 'pending',
        workerStatuses: { $elemMatch: { worker: workerId, status: 'pending' } },
        $expr: {
          $lt: [
            {
              $size: {
                $filter: {
                  input: '$workerStatuses',
                  as: 'ws',
                  cond: { $in: ['$$ws.status', ACTIVE_WORKER_STATUSES] },
                },
              },
            },
            '$requiredWorkers',
          ],
        },
      },
      [
        {
          $set: {
            workerStatuses: {
              $map: {
                input: '$workerStatuses',
                as: 'ws',
                in: {
                  $cond: [
                    { $and: [{ $eq: ['$$ws.worker', workerId] }, { $eq: ['$$ws.status', 'pending'] }] },
                    { $mergeObjects: ['$$ws', { status: 'accepted', acceptedAt: '$$NOW' }] },
                    '$$ws',
                  ],
                },
              },
            },
            workers: { $setUnion: ['$workers', [workerId]] },
          },
        },
      ],
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({ success: false, message: 'This request is no longer available.' });
    }

    await Worker.findByIdAndUpdate(workerId, { isAvailable: false }).catch(() => {});

    const acceptedCount = updated.workerStatuses.filter((w) => ACTIVE_WORKER_STATUSES.includes(w.status)).length;
    const fullyStaffed  = acceptedCount >= updated.requiredWorkers;

    let closedWorkerIds = [];
    if (fullyStaffed) {
      closedWorkerIds = updated.workerStatuses.filter((w) => w.status === 'pending').map((w) => w.worker.toString());
      updated.workerStatuses.forEach((w) => { if (w.status === 'pending') w.status = 'expired'; });
      updated.status = 'accepted';
      await updated.save();
    }

    await Promise.allSettled(
      updated.workerStatuses.map((w) => invalidateCache(`bp:worker:${w.worker}:requests:pending:*`))
    );
    await invalidateCache(`bookings:user:${updated.user}:*`, `bookings:detail:${bookingId}`).catch(() => {});

    try {
      const { getIO } = require('../services/socketService');
      const io = getIO();
      io.to(`customer_${updated.user}`).emit('autobook_worker_accepted', {
        bookingId, workerId: workerId.toString(), acceptedCount, requiredWorkers: updated.requiredWorkers, fullyStaffed,
      });
      closedWorkerIds.forEach((wId) => {
        io.to(`worker_${wId}`).emit('autobook_request_closed', { bookingId });
      });
      if (fullyStaffed) {
        io.to(`booking_${bookingId}`).emit('booking_status_changed', { bookingId, status: 'accepted', isAutobook: true });
      }
    } catch (err) {
      logger.error({ err }, 'Failed to emit autobook accept events');
    }

    res.json({ success: true, booking: updated, acceptedCount, requiredWorkers: updated.requiredWorkers, fullyStaffed });
  } catch (err) {
    logger.error({ err }, 'acceptAutobookRequest failed');
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

    // ── AUTOBOOK: each accepted worker progresses through their own
    // sub-status entirely independently of the other workers on this job.
    if (booking.isAutobook) {
      const workerIdStr = req.worker._id.toString();
      const entry = booking.workerStatuses.find((w) => w.worker.toString() === workerIdStr);
      if (!entry || !['accepted', 'arrived', 'in_progress', 'awaiting_customer_confirmation'].includes(entry.status)) {
        return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
      }

      if (status === 'arrived' && !entry.checkInTime) {
        const { latitude, longitude } = req.body;
        if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
          return res.status(400).json({
            success: false,
            message: 'Your current location is required to mark yourself as arrived.',
          });
        }
        if (booking.latitude != null && booking.longitude != null) {
          const distance = getDistanceInMeters(Number(latitude), Number(longitude), booking.latitude, booking.longitude);
          if (distance > ARRIVAL_RADIUS_METERS) {
            return res.status(403).json({
              success: false,
              message: `You must be within ${ARRIVAL_RADIUS_METERS}m of the customer's location to mark as arrived. You are currently ~${Math.round(distance)}m away.`,
            });
          }
        }
        entry.checkInTime = new Date();
      }

      if (status === 'in_progress' && !entry.workStartTime) {
        entry.workStartTime = new Date();
        if (!entry.hourlyRate) {
          entry.hourlyRate = Number(entry.workerSnapshot?.pricePerDay) || Number(entry.workerSnapshot?.minCharge) || 0;
        }
      }

      if (status === 'awaiting_customer_confirmation' && !entry.checkOutTime) {
        entry.checkOutTime = new Date();
        if (req.body.paymentMethod) entry.paymentMethod = req.body.paymentMethod;
      }
      if (status === 'completed' && !entry.checkOutTime) {
        entry.checkOutTime = new Date();
        if (req.body.paymentMethod) entry.paymentMethod = req.body.paymentMethod;
      }

      if (
        ['awaiting_customer_confirmation', 'completed'].includes(status) &&
        booking.isImmediate && booking.bookingType === 'labour' &&
        entry.workStartTime && entry.hoursWorked == null
      ) {
        const hourlyRate = entry.hourlyRate || Number(entry.workerSnapshot?.pricePerDay) || 0;
        const baseCharge = Number(entry.workerSnapshot?.baseCharge) || 0;
        const { billedHours, subtotal, baseFeeApplied } = calculateHourlyCharge(
          entry.workStartTime, entry.checkOutTime, hourlyRate, baseCharge
        );
        entry.hoursWorked    = billedHours;
        entry.hourlyRate     = hourlyRate;
        entry.subtotal       = subtotal;
        entry.baseFeeApplied = baseFeeApplied;
        entry.total          = subtotal;
      }

      if (status === 'cancelled') {
        entry.status = 'cancelled';
        booking.workerCancelled = true;
      } else {
        entry.status = status;
      }

      // Aggregate total shown at booking-level = sum of every worker's own bill
      booking.total    = booking.workerStatuses.reduce((sum, w) => sum + (Number(w.total) || 0), 0);
      booking.subtotal = booking.total;

      if (status === 'completed' || status === 'cancelled') {
        await Worker.findByIdAndUpdate(req.worker._id, { isAvailable: true }).catch(() => {});
      }

      await booking.save();

      await Promise.allSettled([
        invalidateCache(`bp:worker:${workerIdStr}:requests:pending:*`, `bp:worker:${workerIdStr}:history:*`, `bp:booking:${bookingId}`),
        invalidateCache(`bookings:user:${booking.user}:*`, `bookings:detail:${bookingId}`),
      ]);

      try {
        const { getIO } = require('../services/socketService');
        const io = getIO();
        if (status === 'awaiting_customer_confirmation') {
          io.to(`customer_${booking.user}`).emit('worker_completion_requested', {
            bookingId, workerId: workerIdStr,
            workerName: entry.workerSnapshot?.name || entry.workerSnapshot?.fullName || 'Your worker',
          });
        } else {
          io.to(`customer_${booking.user}`).emit('booking_updated', {
            operationType: 'update', bookingId, status: booking.status,
          });
        }
        io.to(`booking_${bookingId}`).emit('worker_status_changed', {
          bookingId, workerId: workerIdStr, status: entry.status, isAutobook: true,
        });
      } catch (err) {
        logger.error({ err }, 'Failed to emit autobook worker status event');
      }

      logger.info({ bookingId, workerId: workerIdStr, status: entry.status }, 'Autobook worker status updated');
      return res.json({ success: true, booking });
    }

    // ── MANUAL booking — unchanged original logic ────────────────────────
    const isAssigned = booking.workers.some(id => id.toString() === req.worker._id.toString());
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

    await Promise.allSettled(
      booking.workers.map((wId) =>
        invalidateCache(
          `bp:worker:${wId}:requests:pending:*`,
          `bp:worker:${wId}:history:*`,
          `bp:booking:${bookingId}`
        )
      )
    );

    await invalidateCache(
      `bookings:user:${booking.user}:*`,
      `bookings:detail:${bookingId}`
    ).catch(() => {});

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

module.exports = { getWorkerRequests, acceptAutobookRequest, updateBookingStatus, getWorkerHistory, getBookingById };
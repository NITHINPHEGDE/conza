const Redlock          = require('redlock');
const { getRedis }     = require('../config/redis');

const { withCache, invalidateCache } = require('../utils/cacheHelpers');
const logger           = require('../utils/logger');

let _redlock;
const getRedlock = () => {
  if (!_redlock) {
    _redlock = new Redlock([getRedis()], {
      retryCount:  5,
      retryDelay:  200,
      retryJitter: 100,
    });
    _redlock.on('error', (err) => logger.warn({ err }, 'Redlock error (non-fatal)'));
  }
  return _redlock;
};

const Booking         = require('../models/Booking');
const Worker           = require('../models/Worker');
const ServiceCategory  = require('../models/ServiceCategory');

// Category names must match tolerantly (case/whitespace) — mirrors the
// matcher already used by workerController's getNearbyWorkers.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const categoryMatcher = (category) =>
  category ? { $regex: `^${escapeRegex(category.trim())}$`, $options: 'i' } : undefined;

const sendPushNotification = async (pushToken, title, body, data = {}) => {
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
      },
      body: JSON.stringify({
        to:           pushToken,
        title,
        body,
        data:         { ...data, showFullScreen: 'true', type: 'new_request' },
        sound:        'alert.mp3',
        priority:     'high',
        channelId:    'job-alert',
        ttl:          300,
        expiration:   300,
        _displayInForeground: true,
      }),
    });
    const result = await res.json();
    logger.info({ result }, 'Push notification sent');
  } catch (err) {
    logger.warn({ err }, 'Push notification failed');
  }
};

// ── POST /api/bookings ────────────────────────────────────────────────────
const createBooking = async (req, res) => {
  try {
    const {
      bookingType, workers: workerIds, workerSnapshot, category, items,
      houseNumber, houseName, street, area, city, district, state, pincode,
      address, latitude, longitude,
      subtotal, platformFee, total, paymentMethod, scheduledDate,
      scheduledEndDate, scheduledDates, totalDays,
      notes, description, isImmediate
    } = req.body;

    if (!bookingType || !city || !pincode || !total) {
      return res.status(400).json({ success: false, message: 'Missing required booking fields' });
    }

    logger.info({ workerIds }, 'Creating booking');

    const lockKeys = (workerIds && workerIds.length > 0)
      ? workerIds.map((id) => `lock:worker:${id}`)
      : [`lock:booking:user:${req.user._id}`];

    let booking;
    let locks = [];

    try {
      locks = await Promise.all(
        lockKeys.map((k) =>
          getRedlock().acquire([k], parseInt(process.env.REDIS_LOCK_TTL) || 5000)
        )
      );
    } catch (lockErr) {
      logger.warn({ err: lockErr }, 'Could not acquire lock, proceeding without (Redis may be down)');
    }

    try {
      // Deduct from wallet if payment method is wallet
      if ((paymentMethod === 'wallet') && total > 0) {
        const User = require('../models/User');
        const freshUser = await User.findById(req.user._id).select('walletBalance');
        if (!freshUser) throw new Error('User not found');
        if ((freshUser.walletBalance || 0) < total) {
          return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
        }
        await User.findByIdAndUpdate(req.user._id, { $inc: { walletBalance: -total } });
      }

      booking = await Booking.create({
        user:           req.user._id,
        bookingType,
        workers:        workerIds       || [],
        workerSnapshot: workerSnapshot  || [],
        category:       category        || '',
        items:          items           || [],
        houseNumber:    houseNumber     || '',
        houseName:      houseName       || '',
        street:         street          || '',
        address:        address || street || '',
        area:           area            || '',
        city,
        district:       district        || '',
        state:          state           || '',
        pincode,
        latitude:       latitude        || null,
        longitude:      longitude       || null,
        subtotal:       subtotal        || 0,
        platformFee:    platformFee     || 0,
        total,
        paymentMethod:  paymentMethod   || 'cod',
        scheduledDate:    scheduledDate    || null,
        scheduledEndDate: scheduledEndDate || null,
        scheduledDates:   scheduledDates   || [],
        totalDays:        totalDays        || 1,
        isImmediate:      isImmediate !== undefined ? isImmediate : true,
        notes:          notes           || '',
        description:    description     || '',
      });
    } finally {
      await Promise.allSettled(locks.map((lock) => lock.release()));
    }

    logger.info({ bookingId: booking._id, workers: booking.workers }, 'Booking created');

    // Invalidate the user's booking list cache
    await invalidateCache(`bookings:user:${req.user._id}:*`).catch(() => {});

    // Notify the customer's personal socket room (not broadcast to all)
    try {
      const { getIO } = require('../services/socketService');
      const io = getIO();
      io.to(`customer_${req.user._id}`).emit('booking_updated', {
        operationType:   'insert',
        bookingId:       booking._id.toString(),
        status:          'pending',
        bookingSnapshot: null, // new booking; store will refetch list
      });
    } catch (_) {}

    res.status(201).json({ success: true, booking });

    if (bookingType === 'labour' && workerIds && workerIds.length > 0) {
      Worker.find({ _id: { $in: workerIds } }).select('pushToken fullName').lean()
        .then((workers) => {
          const pushPromises = workers
            .filter((w) => {
              if (!w.pushToken) logger.warn({ workerName: w.fullName }, 'Worker has no push token');
              return w.pushToken;
            })
            .map((w) =>
              sendPushNotification(
                w.pushToken,
                '🔧 New Job Request!',
                `New ${category || 'labour'} job in ${city}. ₹${total}`,
                { bookingId: booking._id.toString(), type: 'new_request' }
              )
            );
          return Promise.allSettled(pushPromises);
        })
        .catch(() => {});

      Worker.updateMany(
        { _id: { $in: workerIds } },
        { $inc: { totalJobs: 1 } }
      ).catch(() => {});
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/bookings/autobook ───────────────────────────────────────────
// Quick Auto Book: finds EVERY nearby, available worker in the category and
// broadcasts the request to all of them at once (no artificial delay — the
// socket emits happen synchronously right after the booking is created).
// Workers accept independently via the bp `/bookings/:id/accept` endpoint;
// once `requiredWorkers` slots are filled the remaining candidates are
// closed out automatically.
const createAutobookBooking = async (req, res) => {
  try {
    const {
      category, requiredWorkers,
      houseNumber, houseName, street, area, city, district, state, pincode,
      address, latitude, longitude,
      paymentMethod, scheduledDate, scheduledEndDate, scheduledDates, totalDays,
      notes, description, isImmediate,
    } = req.body;

    const need = parseInt(requiredWorkers);

    if (!category || !city || !pincode || !need || need < 1) {
      return res.status(400).json({ success: false, message: 'Missing required autobook fields' });
    }
    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      return res.status(400).json({ success: false, message: 'Location is required for Quick Auto Book' });
    }

    // ── Find every nearby, available worker in this category ──────────────
    const serviceCategory = await ServiceCategory.findOne({ name: categoryMatcher(category) }).select('radius').lean();
    const radiusKm       = (serviceCategory && serviceCategory.radius) ? serviceCategory.radius : 5;
    const radiusRadians  = radiusKm / 6371;

    const candidates = await Worker.find({
      category: categoryMatcher(category),
      isAvailable: { $ne: false },
      status:      { $not: { $eq: 'suspended' } },
      isVerified:  true,
      location: {
        $geoWithin: { $centerSphere: [[parseFloat(longitude), parseFloat(latitude)], radiusRadians] },
      },
    }).select('fullName minCharge baseCharge perDayCharge pushToken rating').lean();

    if (!candidates.length) {
      return res.status(404).json({
        success: false,
        message: 'No workers available nearby right now. Please try manual booking instead.',
      });
    }

    const workerStatuses = candidates.map((w) => ({
      worker: w._id,
      status: 'pending',
      workerSnapshot: {
        _id:          w._id,
        name:         w.fullName,
        fullName:     w.fullName,
        pricePerDay:  w.minCharge || 0,
        minCharge:    w.minCharge || 0,
        baseCharge:   w.baseCharge || 0,
        perDayCharge: w.perDayCharge || 0,
        rating:       w.rating || 5,
      },
    }));

    // Rough upfront estimate — used for wallet-balance gating and bill
    // display only. The real per-worker charge for immediate jobs is billed
    // after each worker's job finishes (see bp bookingController).
    const avgRate    = candidates.reduce((s, w) => s + (Number(w.minCharge) || 0), 0) / candidates.length;
    const isMultiDay = !isImmediate && totalDays && totalDays > 1;
    const estimatedSubtotal = Math.round(isMultiDay ? avgRate * need * totalDays : avgRate * need);
    const fee = Math.round(estimatedSubtotal * 0.05);

    if ((paymentMethod === 'wallet') && (estimatedSubtotal + fee) > 0) {
      const User = require('../models/User');
      const freshUser = await User.findById(req.user._id).select('walletBalance');
      if (!freshUser) return res.status(400).json({ success: false, message: 'User not found' });
      if ((freshUser.walletBalance || 0) < (estimatedSubtotal + fee)) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      }
      await User.findByIdAndUpdate(req.user._id, { $inc: { walletBalance: -(estimatedSubtotal + fee) } });
    }

    const booking = await Booking.create({
      user: req.user._id,
      bookingType: 'labour',
      isAutobook: true,
      requiredWorkers: need,
      workers: [],
      workerStatuses,
      category,
      houseNumber: houseNumber || '',
      houseName:   houseName   || '',
      street:      street      || '',
      address:     address || street || '',
      area:        area || '',
      city,
      district: district || '',
      state:    state    || '',
      pincode,
      latitude:  parseFloat(latitude),
      longitude: parseFloat(longitude),
      subtotal:    estimatedSubtotal,
      platformFee: fee,
      total:       estimatedSubtotal + fee,
      paymentMethod: paymentMethod || 'cod',
      scheduledDate:    scheduledDate    || null,
      scheduledEndDate: scheduledEndDate || null,
      scheduledDates:   scheduledDates   || [],
      totalDays:        totalDays        || 1,
      isImmediate:      isImmediate !== undefined ? isImmediate : true,
      notes:       notes       || '',
      description: description || '',
      status: 'pending',
    });

    logger.info({ bookingId: booking._id, candidateCount: candidates.length, need }, 'Autobook request created');

    await invalidateCache(`bookings:user:${req.user._id}:*`).catch(() => {});

    // ── Broadcast to every candidate worker instantly ──────────────────────
    try {
      const { getIO } = require('../services/socketService');
      const io = getIO();
      io.to(`customer_${req.user._id}`).emit('booking_updated', {
        operationType: 'insert', bookingId: booking._id.toString(), status: 'pending', bookingSnapshot: null,
      });
      candidates.forEach((w) => {
        io.to(`worker_${w._id}`).emit('new_autobook_request', { bookingId: booking._id.toString() });
      });
    } catch (_) {}

    res.status(201).json({ success: true, booking, candidateCount: candidates.length });

    // Push notifications — fire and forget, after responding
    const pushPromises = candidates
      .filter((w) => w.pushToken)
      .map((w) => sendPushNotification(
        w.pushToken,
        '⚡ New Quick Job!',
        `New ${category} job in ${city}. First come, first served!`,
        { bookingId: booking._id.toString(), type: 'new_request' }
      ));
    Promise.allSettled(pushPromises).catch(() => {});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bookings/my ──────────────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const userId   = req.user._id.toString();
    const { page = 1, limit = 20 } = req.query;
    const skip     = (Number(page) - 1) * Number(limit);
    const cacheKey = `bookings:user:${userId}:${page}:${limit}`;
    const TTL      = 20;

    const result = await withCache(cacheKey, TTL, async () => {
      const [bookings, total] = await Promise.all([
        Booking.find({ user: userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate('workers', 'fullName category profileImage')
          .lean(),
        Booking.countDocuments({ user: userId }),
      ]);
      return { bookings, total };
    });

    res.json({
      success: true,
      total:   result.total,
      page:    Number(page),
      pages:   Math.ceil(result.total / Number(limit)),
      bookings: result.bookings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bookings/:id ─────────────────────────────────────────────────
const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;

    // When the client appends ?_cb=<timestamp>, bypass Redis cache entirely.
    // This is used by the socket-triggered fetchActiveBooking to guarantee
    // fresh data after a status change, without poisoning the cache for
    // other callers (e.g. initial page loads) that still benefit from caching.
    if (req.query._cb) {
      const booking = await Booking.findOne({ _id: bookingId, user: req.user._id })
        .populate('workers', 'fullName category profileImage rating phone bio')
        .lean();
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
      return res.json({ success: true, booking });
    }

    const cacheKey = `bookings:detail:${bookingId}`;
    const TTL      = 30;

    const booking = await withCache(cacheKey, TTL, () =>
      Booking.findOne({ _id: bookingId, user: req.user._id })
        .populate('workers', 'fullName category profileImage rating phone bio')
        .lean()
    );

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/bookings/:id/cancel ───────────────────────────────────────
const { getIO } = require('../services/socketService');

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // ── AUTOBOOK: "cancel" stops the search, it doesn't cancel workers who
    // already accepted. They keep coming; the request just disappears from
    // whoever hasn't accepted yet. ──────────────────────────────────────
    if (booking.isAutobook) {
      if (booking.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'This booking is already fully staffed and cannot be cancelled from here.' });
      }

      const acceptedEntries = booking.workerStatuses.filter((w) => !['pending', 'expired'].includes(w.status));
      const pendingEntries  = booking.workerStatuses.filter((w) => w.status === 'pending');

      pendingEntries.forEach((w) => { w.status = 'expired'; });

      if (acceptedEntries.length === 0) {
        booking.status = 'cancelled';
      } else {
        booking.requiredWorkers = acceptedEntries.length;
        booking.status = 'accepted';
      }
      await booking.save();

      await invalidateCache(
        `bookings:detail:${booking._id}`,
        `bookings:user:${req.user._id}:*`
      );

      try {
        const io = getIO();
        io.to(`customer_${req.user._id}`).emit('booking_updated', {
          operationType:   'update',
          bookingId:       booking._id.toString(),
          status:          booking.status,
          bookingSnapshot: null,
        });
        pendingEntries.forEach((w) => {
          io.to(`worker_${w.worker}`).emit('autobook_request_closed', { bookingId: booking._id.toString() });
        });
      } catch (_) {}

      return res.json({ success: true, booking });
    }

    // ── MANUAL booking — unchanged ─────────────────────────────────────
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Cannot cancel booking after it has been accepted' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Invalidate caches for this booking and the user's list
    await invalidateCache(
      `bookings:detail:${booking._id}`,
      `bookings:user:${req.user._id}:*`
    );

    try {
      const io = getIO();
      // Target customer's personal room — do not broadcast to all sockets
      io.to(`customer_${req.user._id}`).emit('booking_updated', {
        operationType:   'update',
        bookingId:       booking._id.toString(),
        status:          'cancelled',
        bookingSnapshot: null,
      });
      io.to(`booking_${booking._id}`).emit('booking_status_changed', {
        bookingId:       booking._id.toString(),
        status:          'cancelled',
        bookingSnapshot: null,
        isWorkCompletion: false,
      });
    } catch (_) {}

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const confirmCompletion = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { workerId } = req.body;

    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // ── AUTOBOOK: confirm just this worker's own sub-job ─────────────────
    if (booking.isAutobook) {
      if (!workerId) {
        return res.status(400).json({ success: false, message: 'workerId is required for this booking' });
      }
      const entry = booking.workerStatuses.find((w) => w.worker.toString() === workerId.toString());
      if (!entry) {
        return res.status(404).json({ success: false, message: 'Worker not found on this booking' });
      }
      if (entry.status !== 'awaiting_customer_confirmation') {
        return res.status(400).json({ success: false, message: 'This worker is not awaiting confirmation' });
      }

      entry.status = 'completed';

      const allDone = booking.workerStatuses
        .filter((w) => !['pending', 'expired'].includes(w.status))
        .every((w) => w.status === 'completed');
      if (allDone) booking.status = 'completed';

      await booking.save();

      await Worker.findByIdAndUpdate(workerId, { isAvailable: true }).catch(() => {});

      await invalidateCache(
        `bookings:detail:${booking._id}`,
        `bookings:user:${req.user._id}:*`
      );

      try {
        const io = getIO();
        io.to(`customer_${req.user._id}`).emit('booking_updated', {
          operationType: 'update', bookingId: booking._id.toString(), status: booking.status, bookingSnapshot: null,
        });
        io.to(`booking_${bookingId}`).emit('worker_status_changed', {
          bookingId, workerId: workerId.toString(), status: 'completed', isAutobook: true,
        });
        if (allDone) {
          io.to(`booking_${bookingId}`).emit('booking_status_changed', {
            bookingId, status: 'completed', isAutobook: true,
          });
        }
      } catch (_) {}

      return res.json({ success: true, booking });
    }

    // ── MANUAL booking — unchanged ─────────────────────────────────────
    if (booking.status !== 'awaiting_customer_confirmation') {
      return res.status(400).json({ success: false, message: 'Booking is not awaiting confirmation' });
    }

    booking.status = 'completed';
    await booking.save();

    // Release workers
    if (booking.workers && booking.workers.length > 0) {
      await Worker.updateMany({ _id: { $in: booking.workers } }, { isAvailable: true });
    }

    await invalidateCache(
      `bookings:detail:${booking._id}`,
      `bookings:user:${req.user._id}:*`
    );

    try {
      const io = getIO();
      // Notify customer's personal room
      io.to(`customer_${req.user._id}`).emit('booking_updated', {
        operationType:   'update',
        bookingId:       booking._id.toString(),
        status:          'completed',
        bookingSnapshot: null,
      });
      io.to(`booking_${booking._id}`).emit('booking_status_changed', {
        bookingId:        booking._id.toString(),
        status:           'completed',
        bookingSnapshot:  null,
        isWorkCompletion: false,
      });
      // Notify workers via their booking room
      booking.workers.forEach(wId => {
        io.to(`booking_${bookingId}`).emit('job_completed_confirmed', { bookingId });
      });
    } catch (_) {}

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const reportIssue = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { comment } = req.body;

    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'awaiting_customer_confirmation') {
      return res.status(400).json({ success: false, message: 'Booking is not awaiting confirmation' });
    }

    booking.issueReport = {
      comment: comment || '',
      reportedAt: new Date()
    };
    await booking.save();

    await invalidateCache(
      `bookings:detail:${booking._id}`,
      `bookings:user:${req.user._id}:*`
    );

    try {
      const io = getIO();
      // Notify via booking room so the labour app (which is joined to booking_{id}) receives it
      io.to(`booking_${bookingId}`).emit('issue_reported', { bookingId });
    } catch (_) {}

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
module.exports = { createBooking, createAutobookBooking, getMyBookings, getBookingById, cancelBooking, confirmCompletion, reportIssue };// 
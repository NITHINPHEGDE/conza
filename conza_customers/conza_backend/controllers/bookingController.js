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

const Booking = require('../models/Booking');
const Worker  = require('../models/Worker');

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
        scheduledDate:  scheduledDate   || null,
        isImmediate:    isImmediate !== undefined ? isImmediate : true,
        notes:          notes           || '',
        description:    description     || '',
      });
    } finally {
      await Promise.allSettled(locks.map((lock) => lock.release()));
    }

    logger.info({ bookingId: booking._id, workers: booking.workers }, 'Booking created');

    // Invalidate the user's booking list cache
    await invalidateCache(`bookings:user:${req.user._id}`).catch(() => {});

    try {
      const { getIO } = require('../services/socketService');
      const io = getIO();
      io.emit('booking_updated', {
        operationType: 'insert',
        bookingId:     booking._id.toString(),
        status:        'pending',
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

// ── GET /api/bookings/my ──────────────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const userId   = req.user._id.toString();
    const cacheKey = `bookings:user:${userId}`;
    const TTL      = 20; // seconds — short so status changes reflect quickly

    const bookings = await withCache(cacheKey, TTL, () =>
      Booking.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('workers', 'fullName category profileImage')
        .lean()
    );

    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bookings/:id ─────────────────────────────────────────────────
const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const cacheKey  = `bookings:detail:${bookingId}`;
    const TTL       = 30;

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
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Cannot cancel booking after it has been accepted' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Invalidate caches for this booking and the user's list
    await invalidateCache(
      `bookings:detail:${booking._id}`,
      `bookings:user:${req.user._id}`
    );

    try {
      const io = getIO();
      io.emit('booking_updated', {
        operationType: 'update',
        bookingId:     booking._id,
        status:        'cancelled',
      });
      io.to(`booking_${booking._id}`).emit('booking_status_changed', {
        bookingId: booking._id,
        status:    'cancelled',
      });
    } catch (_) {}

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking };
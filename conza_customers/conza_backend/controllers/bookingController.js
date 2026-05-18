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
        data:         { ...data, showFullScreen: 'true' },
        sound:        'alert',
        priority:     'high',
        channelId:    'job-alert',
        ttl:          300,
        expiration:   300,
      }),
    });
    const result = await res.json();
    console.log('[Push] Expo response:', JSON.stringify(result));
  } catch (err) {
    console.warn('[Push] Failed to send notification:', err.message);
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

    console.log('📝 Creating booking for workers:', workerIds);

    const booking = await Booking.create({
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

    console.log('✅ Booking created:', booking._id, 'Workers:', booking.workers);

    // Emit socket event to all connected BP workers immediately
    try {
      const { getIO } = require('../services/socketService');
      const io = getIO();
      io.emit('booking_updated', {
        operationType: 'insert',
        bookingId:     booking._id.toString(),
        status:        'pending',
      });
    } catch (_) {}

    // Send push notification to each worker
    if (bookingType === 'labour' && workerIds && workerIds.length > 0) {
      const workers = await Worker.find({ _id: { $in: workerIds } }).select('pushToken fullName');
      for (const worker of workers) {
        console.log(`[Push] Worker ${worker.fullName} token: ${worker.pushToken}`);
        if (worker.pushToken) {
          await sendPushNotification(
            worker.pushToken,
            '🔧 New Job Request!',
            `New ${category || 'labour'} job in ${city}. ₹${total}`,
            { bookingId: booking._id.toString(), type: 'new_request' }
          );
        } else {
          console.warn(`[Push] Worker ${worker.fullName} has no push token`);
        }
      }
    }

    // Bump totalJobs on each worker
    if (bookingType === 'labour' && workerIds && workerIds.length > 0) {
      await Worker.updateMany(
        { _id: { $in: workerIds } },
        { $inc: { totalJobs: 1 } }
      );
    }

    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bookings/my ──────────────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('workers', 'fullName category profileImage');
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bookings/:id ─────────────────────────────────────────────────
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id })
      .populate('workers', 'fullName category profileImage rating phone bio');
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
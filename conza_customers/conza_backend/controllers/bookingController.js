const mongoose         = require('mongoose');
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
const Review           = require('../models/Review');
const { getLabourPricingConfig, getLabourPricingConfigFresh, computeLabourBill, computeLabourScenarioEstimates, billNeedsRepricing } = require('../utils/pricingEngine');

// Category names must match tolerantly (case/whitespace) — mirrors the
// matcher already used by workerController's getNearbyWorkers.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const categoryMatcher = (category) =>
  category ? { $regex: `^${escapeRegex(category.trim())}$`, $options: 'i' } : undefined;

// ── Final hourly bill (labour, immediate bookings only) ────────────────
// Nothing about billing is shown to the customer until they tap "Confirm
// Work Completed" — at that point we compute the true final amount from
// the admin-configured Labour pricing (surge → service → gst → platform),
// using the actual hours worked, and persist it so the status screen
// reflects the exact same number from then on.
//
// Base Price rule: each service category has its OWN admin-configured
// Base Price (ServiceCategory.baseCharge, set per-category in Finance →
// Categories) — covers the first hour of work as a fixed charge.
// When the job runs under or up to 1 hour, that flat Base Price is used as the
// base. For work exceeding 1 hour, the fixed Base Price covers the first hour,
// and all extra time worked is billed per-minute based on the hourly rate.
// Either way, the resulting base still goes through the exact same pipeline:
// surge → service → gst → platform.
const computeFinalHourlyBase = (hourlyRateInput, workerSnapshot, hoursWorkedInput, categoryBaseCharge) => {
  const snapshot = Array.isArray(workerSnapshot) ? workerSnapshot : [];
  const combinedHourlyRate = Number(hourlyRateInput) ||
    snapshot.reduce((sum, w) => sum + (Number(w.pricePerDay) || 0), 0);
  const combinedBaseCharge = snapshot.length > 0
    ? snapshot.reduce((sum, w) => sum + (Number(w.baseCharge) || Number(categoryBaseCharge) || 0), 0)
    : (Number(categoryBaseCharge) || 0);
  const parsedHours = Number(hoursWorkedInput);
  const hoursWorked = Number.isFinite(parsedHours) && parsedHours > 0 ? parsedHours : 0;
  const isUnderAnHour = hoursWorked < 1;
  const extraHours = Math.max(0, hoursWorked - 1);
  const rawBase = isUnderAnHour
    ? combinedBaseCharge
    : Math.round(combinedBaseCharge + (combinedHourlyRate * extraHours));
  return {
    combinedHourlyRate,
    hoursWorked,
    baseFeeApplied: isUnderAnHour,
    rawBase,
  };
};

const ACTIVE_WORKER_STATUSES = ['accepted', 'arrived', 'in_progress', 'awaiting_customer_confirmation', 'completed'];

// ── Labour payment settlement ──────────────────────────────────────────────
// A labour booking is created UNPAID (paymentMethod 'pending') and is settled
// after the work is completed in exactly ONE of two ways:
//   1. the customer pays online from Booking Details → Continue to Payment
//      (payBooking below), or
//   2. the labour collects cash and taps "Cash Collected" in the labour app.
// Once settled either way the booking must never be payable again. The state,
// quote and pay endpoints all go through the same helpers so the customer can
// never pay twice.
const PAID_STATUS_VALUES = ['paid', 'collected', 'cash_collected', 'settled'];
const CASH_STATUS_VALUES = ['collected', 'cash_collected'];
const PAY_METHODS        = ['upi', 'card', 'wallet'];
const lc       = (v) => String(v || '').toLowerCase();
const roundNum = (n) => Math.round(Number(n) || 0);

// A "unit" is either a whole booking or one autobook worker entry.
const isCashCollectedUnit = (u) =>
  !!u && (
    u.cashCollected === true ||
    u.isCashCollected === true ||
    !!u.cashCollectedAt ||
    CASH_STATUS_VALUES.includes(lc(u.paymentStatus))
  );

const isSettledUnit = (u) =>
  !!u && (
    isCashCollectedUnit(u) ||
    u.isPaid === true ||
    !!u.paidAt ||
    PAID_STATUS_VALUES.includes(lc(u.paymentStatus))
  );

// Quick Auto Book immediate jobs are billed per worker (entry.total); every
// other labour booking is billed on the booking itself.
const usesPerWorkerBilling = (booking) =>
  !!booking && !!booking.isAutobook &&
  (booking.workerStatuses || []).some((w) => w.status === 'completed' && Number(w.total) > 0);

const getPaymentState = (booking) => {
  const none = { settled: false, paid: false, cashCollected: false, canPay: false, payableAmount: 0 };
  if (!booking || booking.bookingType !== 'labour') return none;

  if (usesPerWorkerBilling(booking)) {
    const done = (booking.workerStatuses || []).filter((w) => w.status === 'completed' && Number(w.total) > 0);
    const open = done.filter((w) => !isSettledUnit(w));
    const openAmount = open.reduce((sum, w) => sum + (Number(w.total) || 0), 0);
    return {
      settled:       open.length === 0,
      paid:          done.some((w) => lc(w.paymentStatus) === 'paid'),
      cashCollected: done.some(isCashCollectedUnit),
      canPay:        booking.status === 'completed' && open.length > 0,
      payableAmount: open.length > 0 ? openAmount : 0,
    };
  }

  const completedEntries = (booking.workerStatuses || []).filter((w) => w.status === 'completed');
  const entriesAllSettled = !!booking.isAutobook && completedEntries.length > 0 && completedEntries.every(isSettledUnit);
  const settled = isSettledUnit(booking) || entriesAllSettled;
  const amount  = Number(booking.total) || 0;
  return {
    settled,
    paid:          lc(booking.paymentStatus) === 'paid',
    cashCollected: isCashCollectedUnit(booking) || (entriesAllSettled && completedEntries.some(isCashCollectedUnit)),
    canPay:        booking.status === 'completed' && !settled && amount > 0,
    payableAmount: settled ? 0 : amount,
  };
};

const getPaymentBlockReason = (state, booking) => {
  if (state.canPay) return null;
  if (state.settled) return state.cashCollected ? 'cash_collected' : 'already_paid';
  if (!booking || booking.status !== 'completed') return 'not_completed';
  return 'nothing_due';
};

// One bill line-up for the payment page. Foundation rule:
//   • work under 1 hour  → the category BASE PRICE is the foundation
//   • work of 1 hour+    → the price calculated by the pricing calculation
//                          (base price + extra time at the hourly rate)
// then surge → minimum charge → service → GST → platform, exactly as it was
// persisted when the customer confirmed the work.
const makeQuoteUnit = (raw) => {
  const subtotal = roundNum(raw.subtotal);
  let multiplier = Number(raw.peak) || 1;
  let foundation = roundNum(raw.foundation);
  let afterSurge = roundNum(foundation * multiplier);
  // Foundation missing / stale (older bookings): fall back to the stored subtotal
  if (!(foundation > 0) || afterSurge > subtotal) {
    foundation = subtotal;
    multiplier = 1;
    afterSurge = subtotal;
  }
  const serviceCharge            = roundNum(raw.serviceCharge);
  const costRateAmount           = roundNum(raw.costRateAmount);
  const platformCommissionAmount = roundNum(raw.platformCommissionAmount);
  const total                    = roundNum(raw.total);
  return {
    foundation,
    peakHourMultiplier:  multiplier,
    surgeAmount:         afterSurge - foundation,
    minChargeAdjustment: Math.max(0, subtotal - afterSurge),
    subtotal,
    serviceCharge,
    costRate:            Number(raw.costRate) || 0,
    costRateAmount,
    platformCommission:  Number(raw.platformCommission) || 0,
    platformCommissionAmount,
    otherCharges:        Math.max(0, total - (subtotal + serviceCharge + costRateAmount + platformCommissionAmount)),
    total,
    hoursWorked:         raw.hoursWorked != null ? Number(raw.hoursWorked) : null,
    hourlyRate:          raw.hourlyRate != null ? Number(raw.hourlyRate) : null,
    baseFeeApplied:      !!raw.baseFeeApplied,
  };
};

const buildPaymentQuote = async (booking) => {
  const units = [];

  if (usesPerWorkerBilling(booking)) {
    const categoryDoc = await ServiceCategory.findOne({ name: categoryMatcher(booking.category) }).select('baseCharge').lean();
    (booking.workerStatuses || [])
      .filter((w) => w.status === 'completed' && Number(w.total) > 0 && !isSettledUnit(w))
      .forEach((w) => {
        const { rawBase } = computeFinalHourlyBase(
          w.hourlyRate,
          w.workerSnapshot ? [w.workerSnapshot] : [],
          w.hoursWorked,
          categoryDoc?.baseCharge
        );
        const b = w.billing || {};
        units.push(makeQuoteUnit({
          foundation: rawBase,
          peak: b.peakHourMultiplier,
          subtotal: w.subtotal,
          serviceCharge: b.serviceCharge,
          costRate: b.costRate,
          costRateAmount: b.costRateAmount,
          platformCommission: b.platformCommission,
          platformCommissionAmount: b.platformCommissionAmount,
          total: w.total,
          hoursWorked: w.hoursWorked,
          hourlyRate: w.hourlyRate,
          baseFeeApplied: w.baseFeeApplied,
        }));
      });
  } else {
    const b = booking.billing || {};
    units.push(makeQuoteUnit({
      foundation: b.baseCost,
      peak: b.peakHourMultiplier,
      subtotal: booking.subtotal,
      serviceCharge: b.serviceCharge,
      costRate: b.costRate,
      costRateAmount: b.costRateAmount,
      platformCommission: b.platformCommission,
      platformCommissionAmount: b.platformCommissionAmount,
      total: booking.total,
      hoursWorked: booking.hoursWorked,
      hourlyRate: booking.hourlyRate,
      baseFeeApplied: booking.baseFeeApplied,
    }));
  }

  const sum   = (key) => units.reduce((s, u) => s + (Number(u[key]) || 0), 0);
  const first = units[0];
  return {
    isImmediate:  booking.isImmediate !== false,
    totalDays:    Number(booking.totalDays) || 1,
    workerCount:  units.length,
    baseFeeApplied: units.every((u) => u.baseFeeApplied),
    hoursWorked:  units.length === 1 ? first.hoursWorked : null,
    hourlyRate:   units.length === 1 ? first.hourlyRate : null,
    foundation:   sum('foundation'),
    peakHourMultiplier: first.peakHourMultiplier,
    surgeAmount:  sum('surgeAmount'),
    minChargeAdjustment: sum('minChargeAdjustment'),
    subtotal:     sum('subtotal'),
    serviceCharge: sum('serviceCharge'),
    costRate:     first.costRate,
    costRateAmount: sum('costRateAmount'),
    platformCommission: first.platformCommission,
    platformCommissionAmount: sum('platformCommissionAmount'),
    otherCharges: sum('otherCharges'),
    total:        sum('total'),
  };
};

// ── Apply the admin's Finance → Pricing checkboxes at payment time ─────────
// The final bill is persisted when the customer confirms the work, but the
// admin may tick / untick a pricing entity afterwards. Before the "Continue to
// Payment" page shows (and before it charges) an unpaid, completed labour
// booking, its stored bill is re-priced if it no longer matches the ticked
// entities — so an unticked entity is never shown or charged, and a ticked one
// is included. Already-paid / cash-collected units are never touched. Any
// failure is swallowed: the customer still sees / pays the stored bill.
const syncBillWithPricingToggles = async (bookingId, userId) => {
  try {
    const booking = await Booking.findOne({ _id: bookingId, user: userId }).lean();
    if (!booking || booking.bookingType !== 'labour' || booking.status !== 'completed') return false;
    if (!getPaymentState(booking).canPay) return false;

    const [config, categoryDoc] = await Promise.all([
      getLabourPricingConfigFresh(),
      ServiceCategory.findOne({ name: categoryMatcher(booking.category) }).select('baseCharge').lean(),
    ]);

    logger.info(
      { bookingId, enabledFields: config.enabledFields || null },
      'Payment bill: checking pricing entity checkboxes'
    );

    let changed = false;

    if (usesPerWorkerBilling(booking)) {
      // Quick Auto Book: each completed worker has its own bill.
      for (const w of booking.workerStatuses || []) {
        if (w.status !== 'completed' || !(Number(w.total) > 0) || isSettledUnit(w)) continue;
        if (!billNeedsRepricing(w.billing, config)) continue;

        const { rawBase } = computeFinalHourlyBase(
          w.hourlyRate,
          w.workerSnapshot ? [w.workerSnapshot] : [],
          w.hoursWorked,
          categoryDoc?.baseCharge
        );
        if (!(rawBase > 0)) continue;
        const bill = computeLabourBill(rawBase, config, categoryDoc?.baseCharge);

        const result = await Booking.updateOne(
          { _id: bookingId, user: userId, paymentStatus: { $ne: 'processing' } },
          {
            $set: {
              'workerStatuses.$[e].subtotal': bill.subtotal,
              'workerStatuses.$[e].total': bill.total,
              'workerStatuses.$[e].billing': {
                costRate: bill.costRate,
                costRateAmount: bill.costRateAmount,
                peakHourMultiplier: bill.peakHourMultiplier,
                serviceCharge: bill.serviceCharge,
                platformCommission: bill.platformCommission,
                platformCommissionAmount: bill.platformCommissionAmount,
                cancellationFee: bill.cancellationFee,
              },
            },
          },
          {
            arrayFilters: [{
              'e.worker': w.worker,
              'e.status': 'completed',
              'e.paymentStatus': { $nin: PAID_STATUS_VALUES },
              'e.cashCollected': { $ne: true },
            }],
          }
        );
        if (result && result.modifiedCount > 0) changed = true;
      }

      if (changed) {
        // Roll the re-priced per-worker totals up into the booking-level total.
        const fresh = await Booking.findById(bookingId).select('workerStatuses').lean();
        const finished = (fresh?.workerStatuses || []).filter((w) => w.status === 'completed');
        await Booking.updateOne(
          { _id: bookingId },
          {
            $set: {
              subtotal: finished.reduce((s, w) => s + (Number(w.subtotal) || 0), 0),
              total: finished.reduce((s, w) => s + (Number(w.total) || 0), 0),
            },
          }
        );
      }
    } else {
      const stored = booking.billing || {};
      if (!billNeedsRepricing(stored, config)) return false;

      const rawBase = Number(stored.baseCost) || 0;
      if (!(rawBase > 0)) return false;
      const minCharge = stored.minBookingFee != null ? stored.minBookingFee : categoryDoc?.baseCharge;
      const bill = computeLabourBill(rawBase, config, minCharge);

      const result = await Booking.updateOne(
        {
          _id: bookingId,
          user: userId,
          paymentStatus: { $nin: [...PAID_STATUS_VALUES, 'processing'] },
          cashCollected: { $ne: true },
          cashCollectedAt: null,
        },
        {
          $set: {
            subtotal: bill.subtotal,
            platformFee: bill.serviceCharge + bill.platformCommissionAmount,
            total: bill.total,
            billing: {
              baseCost: bill.baseCost,
              costRate: bill.costRate,
              costRateAmount: bill.costRateAmount,
              peakHourApplied: bill.peakHourApplied,
              peakHourMultiplier: bill.peakHourMultiplier,
              minBookingFeeApplied: bill.minBookingFeeApplied,
              minBookingFee: bill.minBookingFee,
              serviceCharge: bill.serviceCharge,
              platformCommission: bill.platformCommission,
              platformCommissionAmount: bill.platformCommissionAmount,
              cancellationFee: bill.cancellationFee,
            },
          },
        }
      );
      changed = !!(result && result.modifiedCount > 0);
    }

    if (changed) {
      logger.info({ bookingId }, 'Payment bill re-priced to match pricing entity checkboxes');
      const workerIds = (booking.workers || []).map((w) => w.toString());
      await invalidateCache(
        `bookings:detail:*:${bookingId}`,
        `bookings:user:${userId}:*`
      ).catch(() => {});
      await Promise.allSettled([
        invalidateCache(`bp:booking:${bookingId}`),
        ...workerIds.map((wId) => invalidateCache(`bp:worker:${wId}:history:*`)),
      ]).catch(() => {});
    }
    return changed;
  } catch (err) {
    logger.error({ err, bookingId }, 'syncBillWithPricingToggles failed (using stored bill)');
    return false;
  }
};

// ── Quick Auto Book: auto-expire if the required category never accepts ──
// This project has no cron/queue infra, so this is scheduled with a plain
// setTimeout right after the autobook request is created (see
// createAutobookBooking below). If the process restarts before it fires the
// timer is lost — same in-memory tradeoff already accepted elsewhere in
// this codebase (no persistent job queue exists here).
const AUTOBOOK_NO_ACCEPT_TIMEOUT_MS = parseInt(process.env.AUTOBOOK_NO_ACCEPT_TIMEOUT_MS) || 5 * 60 * 1000;

const checkAutobookNoAcceptance = async (bookingId, userId) => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking || !booking.isAutobook || booking.status !== 'pending') return;

    const acceptedCount = (booking.workerStatuses || []).filter((w) =>
      ACTIVE_WORKER_STATUSES.includes(w.status)
    ).length;
    if (acceptedCount > 0) return;

    const pendingEntries = booking.workerStatuses.filter((w) => w.status === 'pending');
    pendingEntries.forEach((w) => { w.status = 'expired'; });
    booking.status = 'cancelled';
    await booking.save();

    await invalidateCache(
      `bookings:detail:*:${booking._id}`,
      `bookings:user:${userId}:*`
    ).catch(() => {});

    try {
      const { getIO } = require('../services/socketService');
      const io = getIO();
      io.to(`customer_${userId}`).emit('booking_updated', {
        operationType:   'update',
        bookingId:       booking._id.toString(),
        status:          'cancelled',
        bookingSnapshot: null,
      });
      io.to(`customer_${userId}`).emit('autobook_no_acceptance', {
        bookingId:       booking._id.toString(),
        category:        booking.category,
        requiredWorkers: booking.requiredWorkers,
      });
      pendingEntries.forEach((w) => {
        io.to(`worker_${w.worker}`).emit('autobook_request_closed', { bookingId: booking._id.toString() });
      });
    } catch (_) {}
  } catch (err) {
    logger.error({ err, bookingId }, 'checkAutobookNoAcceptance failed');
  }
};

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

    if (!bookingType || !city || !pincode) {
      return res.status(400).json({ success: false, message: 'Missing required booking fields' });
    }

    // ── Server-side billing (Finance → Pricing → Labour) ──────────────────
    // For labour bookings, the customer-facing figures the client sent
    // (subtotal/platformFee/total) are only a display estimate. The
    // authoritative bill is always recomputed here from the admin panel's
    // Labour pricing config so it can never be tampered with client-side
    // and always reflects the latest admin settings.
    let billing = null;
    let computedSubtotal = subtotal || 0;
    let computedPlatformFee = platformFee || 0;
    let computedTotal = total;

    if (bookingType === 'labour') {
      const rawBase = Array.isArray(workerSnapshot) && workerSnapshot.length
        ? workerSnapshot.reduce((sum, w) => {
            const isScheduled = !isImmediate;
            const perUnit = isScheduled
              ? (Number(w.perDayCharge) || Number(w.pricePerDay) || 0) * (Number(totalDays) || 1)
              : (Number(w.pricePerDay) || 0);
            return sum + perUnit;
          }, 0)
        : (subtotal || 0);

      const [config, categoryDoc] = await Promise.all([
        getLabourPricingConfig(),
        ServiceCategory.findOne({ name: categoryMatcher(category) }).select('baseCharge').lean(),
      ]);
      const bill = computeLabourBill(rawBase, config, categoryDoc?.baseCharge);

      billing = {
        baseCost: bill.baseCost,
        costRate: bill.costRate,
        costRateAmount: bill.costRateAmount,
        peakHourApplied: bill.peakHourApplied,
        peakHourMultiplier: bill.peakHourMultiplier,
        minBookingFeeApplied: bill.minBookingFeeApplied,
        minBookingFee: bill.minBookingFee,
        serviceCharge: bill.serviceCharge,
        platformCommission: bill.platformCommission,
        platformCommissionAmount: bill.platformCommissionAmount,
        cancellationFee: bill.cancellationFee,
      };
      computedSubtotal = bill.subtotal;
      computedPlatformFee = bill.serviceCharge + bill.platformCommissionAmount;
      computedTotal = bill.total;
    }

    if (!computedTotal) {
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
      // Labour bookings are paid AFTER the work is completed (see payBooking),
      // so nothing is deducted from the wallet when the request is sent.
      if (bookingType !== 'labour' && (paymentMethod === 'wallet') && computedTotal > 0) {
        const User = require('../models/User');
        const freshUser = await User.findById(req.user._id).select('walletBalance');
        if (!freshUser) throw new Error('User not found');
        if ((freshUser.walletBalance || 0) < computedTotal) {
          return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
        }
        await User.findByIdAndUpdate(req.user._id, { $inc: { walletBalance: -computedTotal } });
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
        subtotal:       computedSubtotal,
        platformFee:    computedPlatformFee,
        total:          computedTotal,
        billing:        billing         || undefined,
        paymentMethod:  bookingType === 'labour' ? 'pending' : (paymentMethod || 'cod'),
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

    // ── Notify the assigned worker(s) in real time ───────────────────────
    // A push notification alone is not enough: it silently does nothing if
    // the worker has no valid pushToken, hasn't granted notification
    // permission, or the app is backgrounded/killed on some platforms.
    // getWorkerRequests() caches each worker's pending-list response for up
    // to ~45s (15s TTL + up to 30s jitter) — without invalidating that here,
    // a worker who already has a cached "no requests" response keeps seeing
    // that stale empty list for up to 45s even though this brand-new
    // request now exists for them, while a worker who happens to get the
    // push sees it instantly. That gap is what makes it look like some
    // workers "never got the request" when they're actually just waiting
    // out a stale cache.
    if (bookingType === 'labour' && workerIds && workerIds.length > 0) {
      await Promise.allSettled(
        workerIds.map((wId) => invalidateCache(`bp:worker:${wId}:requests:pending:*`))
      ).catch(() => {});

      try {
        const { getIO } = require('../services/socketService');
        const io = getIO();
        // 'worker_<id>' is the same personal room workers already join on
        // connect (see autobook's 'new_autobook_request' for precedent) —
        // gives an instantly-online worker a zero-latency nudge to refetch,
        // the same way autobook requests already do.
        workerIds.forEach((wId) => {
          io.to(`worker_${wId}`).emit('new_request', { bookingId: booking._id.toString() });
        });
      } catch (_) {}
    }

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
      $or: [
        { 'categories.name': categoryMatcher(category) },
        { category: categoryMatcher(category) },
      ],
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
    const rawBase    = isMultiDay ? avgRate * need * totalDays : avgRate * need;

    // ── Server-side billing (Finance → Pricing → Labour) ──────────────────
    const labourConfig = await getLabourPricingConfig();
    const bill = computeLabourBill(rawBase, labourConfig);
    const estimatedSubtotal = bill.subtotal;
    const fee = bill.serviceCharge + bill.platformCommissionAmount;
    const billing = {
      baseCost: bill.baseCost,
      costRate: bill.costRate,
      costRateAmount: bill.costRateAmount,
      peakHourApplied: bill.peakHourApplied,
      peakHourMultiplier: bill.peakHourMultiplier,
      minBookingFeeApplied: bill.minBookingFeeApplied,
      minBookingFee: bill.minBookingFee,
      serviceCharge: bill.serviceCharge,
      platformCommission: bill.platformCommission,
      platformCommissionAmount: bill.platformCommissionAmount,
      cancellationFee: bill.cancellationFee,
    };

    // Labour bookings are paid AFTER the work is completed (see payBooking),
    // so nothing is deducted from the wallet when the request is sent.

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
      billing,
      paymentMethod: 'pending',
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

    await Promise.allSettled(
      candidates.map((w) => invalidateCache(`bp:worker:${w._id}:requests:pending:*`))
    ).catch(() => {});

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

    // ── Auto-expire if nobody in this category accepts in time ───────────
    setTimeout(() => {
      checkAutobookNoAcceptance(booking._id.toString(), req.user._id.toString());
    }, AUTOBOOK_NO_ACCEPT_TIMEOUT_MS);

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
// Before a completed, unpaid labour booking is returned to the app, apply the
// admin's Finance → Pricing checkboxes to its stored bill (see
// syncBillWithPricingToggles) so the booking screen's "Amount due" always
// matches what "Continue to Payment" shows and charges.
const withPricingTogglesApplied = async (booking, bookingId, userId) => {
  if (!booking || booking.bookingType !== 'labour' || booking.status !== 'completed') return booking;
  if (!getPaymentState(booking).canPay) return booking;
  const changed = await syncBillWithPricingToggles(bookingId, userId);
  if (!changed) return booking;
  const fresh = await Booking.findOne({ _id: bookingId, user: userId })
    .populate('workers', 'fullName category profileImage rating phone bio experience totalJobs isVerified')
    .lean();
  return fresh || booking;
};

const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;

    // When the client appends ?_cb=<timestamp>, bypass Redis cache entirely.
    // This is used by the socket-triggered fetchActiveBooking to guarantee
    // fresh data after a status change, without poisoning the cache for
    // other callers (e.g. initial page loads) that still benefit from caching.
    if (req.query._cb) {
      const booking = await Booking.findOne({ _id: bookingId, user: req.user._id })
        .populate('workers', 'fullName category profileImage rating phone bio experience totalJobs isVerified')
        .lean();
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
      const current = await withPricingTogglesApplied(booking, bookingId, req.user._id);
      current.paymentState = getPaymentState(current);
      return res.json({ success: true, booking: current });
    }

    const cacheKey = `bookings:detail:${req.user._id}:${bookingId}`;
    const TTL      = 30;

    const booking = await withCache(cacheKey, TTL, () =>
      Booking.findOne({ _id: bookingId, user: req.user._id })
        .populate('workers', 'fullName category profileImage rating phone bio experience totalJobs isVerified')
        .lean()
    );

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    const current = await withPricingTogglesApplied(booking, bookingId, req.user._id);
    current.paymentState = getPaymentState(current);
    res.json({ success: true, booking: current });
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
        `bookings:detail:*:${booking._id}`,
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
      `bookings:detail:*:${booking._id}`,
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

      // ── Finalize this worker's bill now, on confirmation ────────────────
      // Nothing was shown for this worker's cost before now — compute the
      // true final amount (surge → service → gst → platform) from the
      // actual hours worked and persist it so the status card reflects the
      // exact same number going forward.
      if (booking.bookingType === 'labour' && booking.isImmediate) {
        const [config, categoryDoc] = await Promise.all([
          getLabourPricingConfigFresh(),
          ServiceCategory.findOne({ name: categoryMatcher(booking.category) }).select('baseCharge').lean(),
        ]);
        const { combinedHourlyRate, hoursWorked, baseFeeApplied, rawBase } = computeFinalHourlyBase(
          entry.hourlyRate,
          entry.workerSnapshot ? [entry.workerSnapshot] : [],
          entry.hoursWorked,
          categoryDoc?.baseCharge
        );
        const bill = computeLabourBill(rawBase, config, categoryDoc?.baseCharge);

        entry.hourlyRate = combinedHourlyRate;
        entry.hoursWorked = hoursWorked;
        // True whenever the job ran under 1 hour — the admin's flat Base
        // Price was used instead of an hourly × fraction calculation.
        entry.baseFeeApplied = baseFeeApplied;
        entry.subtotal = bill.subtotal;
        entry.total = bill.total;
        entry.billing = {
          costRate: bill.costRate,
          costRateAmount: bill.costRateAmount,
          peakHourMultiplier: bill.peakHourMultiplier,
          serviceCharge: bill.serviceCharge,
          platformCommission: bill.platformCommission,
          platformCommissionAmount: bill.platformCommissionAmount,
          cancellationFee: bill.cancellationFee,
        };
      }

      entry.status = 'completed';

      const allDone = booking.workerStatuses
        .filter((w) => !['pending', 'expired'].includes(w.status))
        .every((w) => w.status === 'completed');
      if (allDone) {
        booking.status = 'completed';
        // Roll the finalized per-worker totals up into the booking-level
        // total shown on the summary card once every worker is confirmed.
        if (booking.bookingType === 'labour' && booking.isImmediate) {
          const finishedEntries = booking.workerStatuses.filter((w) => w.status === 'completed');
          booking.subtotal = finishedEntries.reduce((sum, w) => sum + (Number(w.subtotal) || 0), 0);
          booking.total    = finishedEntries.reduce((sum, w) => sum + (Number(w.total) || 0), 0);
        }
      }

      await booking.save();

      await Worker.findByIdAndUpdate(workerId, { isAvailable: true }).catch(() => {});

      await invalidateCache(
        `bookings:detail:*:${booking._id}`,
        `bookings:user:${req.user._id}:*`
      );

      // ── Invalidate the BP-side cache too ────────────────────────────
      // getBookingById() on the bp backend (hit by the worker app's
      // fetchActiveJob fallback / reconnect-reconciliation path) caches
      // its response for up to ~60s (30s TTL + up to 30s jitter). If the
      // socket event below is missed (worker's app briefly disconnected —
      // very common on mobile), that fallback fetch is the ONLY other way
      // the worker app learns the job is done. Without this, the fallback
      // itself can keep serving the stale pre-completion booking for up
      // to a minute, so the worker screen looks permanently stuck on
      // "waiting for customer approval" instead of self-healing.
      await Promise.allSettled([
        invalidateCache(`bp:booking:${bookingId}`),
        invalidateCache(`bp:worker:${workerId}:requests:pending:*`),
        invalidateCache(`bp:worker:${workerId}:history:*`),
      ]).catch(() => {});

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

    // ── MANUAL booking ────────────────────────────────────────────────
    if (booking.status !== 'awaiting_customer_confirmation') {
      return res.status(400).json({ success: false, message: 'Booking is not awaiting confirmation' });
    }

    // ── Finalize the bill now, on confirmation ──────────────────────────
    // Nothing was shown to the customer about cost before now — compute the
    // true final amount (surge → service → gst → platform) from the actual
    // hours worked and persist it so the status card reflects the exact
    // same number from this point on.
    if (booking.bookingType === 'labour' && booking.isImmediate) {
      const [config, categoryDoc] = await Promise.all([
        getLabourPricingConfigFresh(),
        ServiceCategory.findOne({ name: categoryMatcher(booking.category) }).select('baseCharge').lean(),
      ]);
      const { combinedHourlyRate, hoursWorked, baseFeeApplied, rawBase } = computeFinalHourlyBase(
        booking.hourlyRate,
        booking.workerSnapshot,
        booking.hoursWorked,
        categoryDoc?.baseCharge
      );
      const bill = computeLabourBill(rawBase, config, categoryDoc?.baseCharge);

      booking.hourlyRate     = combinedHourlyRate;
      booking.hoursWorked    = hoursWorked;
      // True whenever the job ran under 1 hour — the admin's flat Base
      // Price was used instead of an hourly × fraction calculation.
      booking.baseFeeApplied = baseFeeApplied;
      booking.subtotal       = bill.subtotal;
      booking.platformFee    = bill.serviceCharge + bill.platformCommissionAmount;
      booking.total          = bill.total;
      booking.billing        = {
        baseCost: bill.baseCost,
        costRate: bill.costRate,
        costRateAmount: bill.costRateAmount,
        peakHourApplied: bill.peakHourApplied,
        peakHourMultiplier: bill.peakHourMultiplier,
        minBookingFeeApplied: bill.minBookingFeeApplied,
        minBookingFee: bill.minBookingFee,
        serviceCharge: bill.serviceCharge,
        platformCommission: bill.platformCommission,
        platformCommissionAmount: bill.platformCommissionAmount,
        cancellationFee: bill.cancellationFee,
      };
    }

    booking.status = 'completed';
    await booking.save();

    // Release workers
    if (booking.workers && booking.workers.length > 0) {
      await Worker.updateMany({ _id: { $in: booking.workers } }, { isAvailable: true });
    }

    await invalidateCache(
      `bookings:detail:*:${booking._id}`,
      `bookings:user:${req.user._id}:*`
    );

    // ── Invalidate the BP-side cache too ──────────────────────────────
    // Same reasoning as the autobook branch above: without this, a
    // worker whose socket connection missed the 'job_completed_confirmed'
    // event falls back to a stale cached getBookingById() response
    // (up to ~60s) that still shows 'awaiting_customer_confirmation',
    // leaving the screen stuck even after the customer has confirmed.
    await Promise.allSettled([
      invalidateCache(`bp:booking:${bookingId}`),
      ...(booking.workers || []).flatMap((wId) => [
        invalidateCache(`bp:worker:${wId}:requests:pending:*`),
        invalidateCache(`bp:worker:${wId}:history:*`),
      ]),
    ]).catch(() => {});

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
      `bookings:detail:*:${booking._id}`,
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

// PATCH /api/bookings/:id/review — customer rates & reviews the worker
// right after confirming the job as completed. Upserted on (bookingId,
// entityId) so a resubmission edits the same review instead of creating a
// duplicate. Also recomputes the worker's average `rating` so it stays in
// sync everywhere (customer app, bp app, admin) without a separate job.
const submitReview = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { workerId, rating, comment } = req.body;

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'A rating between 1 and 5 is required' });
    }

    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    let targetWorkerId = workerId;

    if (booking.isAutobook) {
      if (!targetWorkerId) {
        return res.status(400).json({ success: false, message: 'workerId is required for this booking' });
      }
      const entry = booking.workerStatuses.find((w) => w.worker.toString() === targetWorkerId.toString());
      if (!entry) {
        return res.status(404).json({ success: false, message: 'Worker not found on this booking' });
      }
      if (entry.status !== 'completed') {
        return res.status(400).json({ success: false, message: 'You can only review a worker after their job is completed' });
      }
    } else {
      if (booking.status !== 'completed') {
        return res.status(400).json({ success: false, message: 'You can only review this booking after it is completed' });
      }
      if (!targetWorkerId) {
        targetWorkerId = booking.workers?.[0]?.toString();
      }
      if (!targetWorkerId || !booking.workers.some((w) => w.toString() === targetWorkerId.toString())) {
        return res.status(400).json({ success: false, message: 'Worker not found on this booking' });
      }
    }

    let worker;
    try {
      worker = await Worker.findById(targetWorkerId);
    } catch (findWorkerErr) {
      return res.status(400).json({ success: false, message: 'Invalid worker reference on this booking' });
    }
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    const customerName = req.user.fullName || req.user.username || 'Customer';

    const reviewFilter = { bookingId: bookingId.toString(), entityType: 'worker', entityId: targetWorkerId.toString() };
    const reviewUpdate = {
      $set: {
        entityType: 'worker',
        entityId:   targetWorkerId.toString(),
        entityName: worker.fullName,
        bookingId:  bookingId.toString(),
        customer:   customerName,
        customerId: req.user._id.toString(),
        rating:     numericRating,
        comment:    comment || '',
        status:     'published',
        isVerified: true,
      },
    };

    let review;
    try {
      review = await Review.findOneAndUpdate(
        reviewFilter,
        reviewUpdate,
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: false }
      );
    } catch (upsertErr) {
      // A double-tap / retry can race the upsert and hit the unique
      // (bookingId, entityType, entityId) index with a duplicate-key error
      // even though the review was actually saved by the other in-flight
      // request. Treat that as a normal update instead of failing the request.
      if (upsertErr?.code === 11000) {
        review = await Review.findOneAndUpdate(reviewFilter, reviewUpdate, { new: true, runValidators: false });
      } else {
        throw upsertErr;
      }
    }

    if (!review) {
      return res.status(500).json({ success: false, message: 'Could not save your review, please try again' });
    }

    // Recompute this worker's average rating across every visible review.
    // Wrapped so a failure here (e.g. worker removed mid-flight) never turns
    // an already-saved review into a 500 for the customer.
    try {
      const agg = await Review.aggregate([
        { $match: { entityType: 'worker', entityId: targetWorkerId.toString(), status: { $ne: 'hidden' } } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]);
      if (agg[0]?.avg != null) {
        await Worker.findByIdAndUpdate(targetWorkerId, { rating: Math.round(agg[0].avg * 10) / 10 });
      }
    } catch (aggErr) {
      logger.warn({ err: aggErr, bookingId: req.params.id }, 'submitReview rating recompute failed (non-fatal)');
    }

    try {
      await invalidateCache(`bookings:detail:*:${booking._id}`, `bookings:user:${req.user._id}:*`);
    } catch (_) {}

    try {
      const { getIO } = require('../services/socketService');
      const io = getIO();
      io.to(`worker_${targetWorkerId}`).emit('new_review', {
        bookingId, rating: numericRating, comment: comment || '',
      });
    } catch (_) {}

    res.json({ success: true, review });
  } catch (err) {
    logger.error({ err, bookingId: req.params.id, userId: req.user?._id }, 'submitReview failed');
    try {
      const Sentry = require('@sentry/node');
      Sentry.captureException(err, {
        extra: { bookingId: req.params.id, userId: req.user?._id, body: req.body },
      });
    } catch (_) {}
    res.status(500).json({
      success: false,
      message: err.message,
      code: err.code,
      name: err.name,
    });
  }
};

// ── POST /api/bookings/labour/bill-preview ─────────────────────────────────
// Live billing preview shown on the checkout screen's final billing summary,
// BEFORE a booking is created — computed the exact same way (same admin
// pricing config, same rules) as the authoritative bill createBooking /
// createAutobookBooking will persist, so what the customer sees matches
// what they're actually charged.
const getLabourBillPreview = async (req, res) => {
  try {
    const {
      workers = [], totalDays = 1, isImmediate = true,
      isAutobook = false, requiredWorkers = 0, category = '',
    } = req.body;

    // Basic input validation / sanitising — the payload is client supplied.
    const safeWorkers = Array.isArray(workers)
      ? workers.filter((w) => w && typeof w === 'object').slice(0, 50)
      : [];
    const safeTotalDays = Math.min(Math.max(parseInt(totalDays, 10) || 1, 1), 365);
    const safeCategory = typeof category === 'string' ? category : '';

    // Always read fresh from the admin DB (no Redis cache) so the config
    // and per-category minimum charge returned to the checkout screen are
    // never stale after an admin save.
    const [config, categoryDoc] = await Promise.all([
      getLabourPricingConfigFresh(),
      safeCategory.trim()
        ? ServiceCategory.findOne({ name: categoryMatcher(safeCategory) })
            .select('baseCharge perHourCharge perDayCharge')
            .lean()
        : Promise.resolve(null),
    ]);
    const categoryBaseCharge = categoryDoc?.baseCharge || 0;
    const isScheduled = !isImmediate;

    // Two-scenario estimate for the checkout "Price Summary":
    //   immediate → { lessThanHour (base charge), oneHour (per-hour rate) }
    //   scheduled → { scheduled (per-day rate × days) }
    // Each scenario runs through the same computeLabourBill() pipeline with
    // the live admin Labour pricing settings.
    const estimates = computeLabourScenarioEstimates({
      workers: safeWorkers,
      config,
      // Admin → Finance → Categories rates for this worker category:
      // Base charge (< 1 hr), Per-hour charge (1 hr), Per-day charge.
      categoryRates: categoryDoc
        ? {
            baseCharge: categoryDoc.baseCharge,
            perHourCharge: categoryDoc.perHourCharge,
            perDayCharge: categoryDoc.perDayCharge,
          }
        : null,
      isImmediate: !isScheduled,
      totalDays: safeTotalDays,
      isAutobook: !!isAutobook,
      requiredWorkers,
    });

    if (isAutobook) {
      const need = parseInt(requiredWorkers) || 0;
      const avgRate = safeWorkers.length
        ? safeWorkers.reduce((s, w) => s + (Number(w.pricePerDay) || 0), 0) / safeWorkers.length
        : 0;
      const rawBase = isScheduled ? avgRate * need * safeTotalDays : avgRate * need;
      const bill = computeLabourBill(rawBase, config, categoryBaseCharge);
      return res.json({
        success: true,
        config: { ...config, categoryBaseCharge },
        summary: bill,
        estimates,
      });
    }

    // Sum all workers' raw costs to get a single combined base, then run
    // computeLabourBill ONCE. This ensures serviceCharge, cancellationFee,
    // the per-category minimum charge, and platformCommission are applied
    // at the booking level — not multiplied by the number of workers.
    const perWorker = safeWorkers.map((w) => {
      const rawBase = isScheduled
        ? (Number(w.perDayCharge) || Number(w.pricePerDay) || 0) * safeTotalDays
        : (Number(w.pricePerDay) || 0);
      return rawBase;
    });

    const totalRawBase = perWorker.reduce((s, n) => s + n, 0);
    const summary = computeLabourBill(totalRawBase, config, categoryBaseCharge);

    res.json({
      success: true,
      config: { ...config, categoryBaseCharge },
      summary,
      estimates,
    });
  } catch (err) {
    logger.error({ err }, 'getLabourBillPreview failed');
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateBookingNotes = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { notes } = req.body;
    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    booking.notes = (notes || '').trim();
    await booking.save();
    await invalidateCache(
      `bookings:detail:*:${booking._id}`,
      `bookings:user:${req.user._id}:*`
    );
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bookings/:id/payment ─────────────────────────────────────────
// Always read fresh from the DB (never cached): drives the "Continue to
// Payment" page and must reflect a labour tapping "Cash Collected" instantly.
const getBookingPayment = async (req, res) => {
  try {
    const bookingId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }
    // Apply the admin's current Finance → Pricing checkboxes to the unpaid bill
    // BEFORE it is shown, so unticked entities never appear on this page.
    await syncBillWithPricingToggles(bookingId, req.user._id);

    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id })
      .populate('workers', 'fullName category')
      .lean();
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.bookingType !== 'labour') {
      return res.status(400).json({ success: false, message: 'Only labour bookings are paid from here' });
    }

    const state  = getPaymentState(booking);
    const reason = getPaymentBlockReason(state, booking);
    const quote  = state.canPay ? await buildPaymentQuote(booking) : null;

    const workerNames = (Array.isArray(booking.workers) && booking.workers.length
      ? booking.workers.map((w) => w && w.fullName)
      : (booking.workerSnapshot || []).map((w) => w && (w.fullName || w.name))
    ).filter(Boolean);

    res.json({
      success: true,
      booking: {
        _id:         booking._id,
        category:    booking.category,
        status:      booking.status,
        isImmediate: booking.isImmediate !== false,
        totalDays:   booking.totalDays || 1,
        workerNames,
      },
      payment: {
        settled:       state.settled,
        paid:          state.paid,
        cashCollected: state.cashCollected,
        canPay:        state.canPay,
        payableAmount: state.payableAmount,
        reason,
        quote,
      },
    });
  } catch (err) {
    logger.error({ err, bookingId: req.params.id }, 'getBookingPayment failed');
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/bookings/:id/pay ────────────────────────────────────────────
// Customer pays the final bill after the work is completed. Safe against
// double payment:
//   • refused when the labour already collected cash / it is already paid
//   • an atomic claim (paymentStatus → 'processing') makes concurrent taps /
//     retries mutually exclusive, so only one request can ever charge
//   • wallet debit is atomic (balance >= amount) and refunded on any failure
const payBooking = async (req, res) => {
  const bookingId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return res.status(400).json({ success: false, message: 'Invalid booking ID' });
  }
  const { paymentMethod } = req.body || {};

  if (!PAY_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ success: false, message: 'Please choose a valid payment method' });
  }

  let claimed        = false;
  let previousStatus = 'unpaid';
  let walletDebited  = 0;
  let finalized      = false;

  const release = async () => {
    await Booking.updateOne(
      { _id: bookingId, paymentStatus: 'processing' },
      { $set: { paymentStatus: previousStatus } }
    ).catch(() => {});
  };
  const settledMessage = (state) =>
    state.cashCollected
      ? 'Your worker has already collected the cash for this booking. No payment is needed.'
      : 'This booking has already been paid.';

  try {
    // Same re-pricing as the payment page, so the amount charged always
    // matches the ticked entities and what the customer was just shown.
    await syncBillWithPricingToggles(bookingId, req.user._id);

    const probe = await Booking.findOne({ _id: bookingId, user: req.user._id }).lean();
    if (!probe) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (probe.bookingType !== 'labour') {
      return res.status(400).json({ success: false, message: 'Only labour bookings are paid from here' });
    }

    const probeState = getPaymentState(probe);
    if (probeState.settled) return res.status(409).json({ success: false, message: settledMessage(probeState) });
    if (!probeState.canPay) {
      return res.status(400).json({ success: false, message: 'Payment is available only after the work is completed.' });
    }

    // ── Atomic claim ────────────────────────────────────────────────────
    const perWorker = usesPerWorkerBilling(probe);
    const claimFilter = perWorker
      ? { _id: bookingId, user: req.user._id, paymentStatus: { $ne: 'processing' } }
      : {
          _id: bookingId,
          user: req.user._id,
          paymentStatus: { $nin: [...PAID_STATUS_VALUES, 'processing'] },
          cashCollected: { $ne: true },
          cashCollectedAt: null,
        };
    const before = await Booking.findOneAndUpdate(
      claimFilter,
      { $set: { paymentStatus: 'processing' } },
      { new: false }
    ).lean();

    if (!before) {
      const current = await Booking.findOne({ _id: bookingId, user: req.user._id }).lean();
      const currentState = getPaymentState(current);
      if (currentState.settled) return res.status(409).json({ success: false, message: settledMessage(currentState) });
      return res.status(409).json({ success: false, message: 'A payment for this booking is already being processed. Please wait a moment.' });
    }
    claimed = true;
    previousStatus = before.paymentStatus && before.paymentStatus !== 'processing' ? before.paymentStatus : 'unpaid';

    // Re-check on the exact document we claimed (a labour may have tapped
    // "Cash Collected" between the probe above and the claim).
    const state = getPaymentState(before);
    if (!state.canPay) {
      await release();
      claimed = false;
      return state.settled
        ? res.status(409).json({ success: false, message: settledMessage(state) })
        : res.status(400).json({ success: false, message: 'Payment is available only after the work is completed.' });
    }

    const amount = state.payableAmount;
    let walletBalanceAfter = null;

    // ── Wallet: atomic debit ────────────────────────────────────────────
    if (paymentMethod === 'wallet') {
      const User = require('../models/User');
      const debited = await User.findOneAndUpdate(
        { _id: req.user._id, walletBalance: { $gte: amount } },
        { $inc: { walletBalance: -amount } },
        { new: true }
      ).select('walletBalance').lean();
      if (!debited) {
        await release();
        claimed = false;
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      }
      walletDebited = amount;
      walletBalanceAfter = debited.walletBalance;
    }

    // ── Mark paid ───────────────────────────────────────────────────────
    const now = new Date();
    if (perWorker) {
      const openWorkerIds = (before.workerStatuses || [])
        .filter((w) => w.status === 'completed' && Number(w.total) > 0 && !isSettledUnit(w))
        .map((w) => w.worker);
      await Booking.updateOne(
        { _id: bookingId },
        {
          $set: {
            paymentStatus: 'paid',
            paymentMethod,
            paidAt: now,
            'workerStatuses.$[e].paymentStatus': 'paid',
            'workerStatuses.$[e].paymentMethod': paymentMethod,
            'workerStatuses.$[e].paidAt': now,
          },
          $inc: { paidAmount: amount },
        },
        { arrayFilters: [{ 'e.worker': { $in: openWorkerIds }, 'e.status': 'completed' }] }
      );
    } else {
      await Booking.updateOne(
        { _id: bookingId },
        { $set: { paymentStatus: 'paid', paymentMethod, paidAt: now, paidAmount: amount } }
      );
    }
    finalized = true;

    // ── Caches + realtime (best effort — payment is already recorded) ──
    const workerIds = (before.workers || []).map((w) => w.toString());
    await invalidateCache(
      `bookings:detail:*:${bookingId}`,
      `bookings:user:${req.user._id}:*`
    ).catch(() => {});
    await Promise.allSettled([
      invalidateCache(`bp:booking:${bookingId}`),
      ...workerIds.map((wId) => invalidateCache(`bp:worker:${wId}:history:*`)),
    ]).catch(() => {});

    try {
      const io = getIO();
      const payload = { bookingId: bookingId.toString(), paymentStatus: 'paid', paymentMethod, amount };
      io.to(`customer_${req.user._id}`).emit('booking_updated', {
        operationType: 'update', bookingId: bookingId.toString(), status: before.status, bookingSnapshot: null,
      });
      io.to(`booking_${bookingId}`).emit('booking_payment_updated', payload);
      workerIds.forEach((wId) => io.to(`worker_${wId}`).emit('booking_payment_updated', payload));
    } catch (_) {}

    return res.json({
      success: true,
      message: 'Payment successful',
      payment: { paid: true, amount, paymentMethod, paidAt: now },
      walletBalance: walletBalanceAfter,
    });
  } catch (err) {
    logger.error({ err, bookingId, userId: req.user?._id }, 'payBooking failed');
    if (!finalized) {
      if (walletDebited > 0) {
        try {
          const User = require('../models/User');
          await User.updateOne({ _id: req.user._id }, { $inc: { walletBalance: walletDebited } });
        } catch (refundErr) {
          logger.error({ err: refundErr, bookingId }, 'payBooking wallet refund failed');
        }
      }
      if (claimed) await release();
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createBooking, createAutobookBooking, getMyBookings, getBookingById, cancelBooking, confirmCompletion, reportIssue, submitReview, getLabourBillPreview, updateBookingNotes, getBookingPayment, payBooking }; 
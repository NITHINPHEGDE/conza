const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    bookingType: {
      type: String, required: true, enum: ['labour', 'material', 'rental'],
    },

    // For labour bookings
    workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
    workerSnapshot: [mongoose.Schema.Types.Mixed],  // stores name/price at time of booking
    category: { type: String, default: '' },

    // For material / rental bookings
    items: [mongoose.Schema.Types.Mixed],

    // Address
    houseNumber: { type: String, default: '' },
    houseName:   { type: String, default: '' },
    street:      { type: String, default: '' },
    address:     { type: String }, // optional combined field
    area:        { type: String, default: '' },
    city:        { type: String, required: true },
    district:    { type: String, default: '' },
    state:       { type: String, default: '' },
    pincode:     { type: String, required: true },
    latitude:    { type: Number, default: null },
    longitude:   { type: Number, default: null },

    // Financials
    subtotal:    { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    total:       { type: Number, required: true },
    paymentMethod: {
      type: String, enum: ['cod', 'upi', 'card', 'wallet', 'pending'], default: 'cod',
    },

    // ── Billing breakdown (Finance → Pricing → Labour, admin-configured) ──
    // Populated server-side from the admin panel's Labour pricing settings
    // at booking-creation time so the customer's final bill always reflects
    // Platform Commission, Cost Rate, Service Charge, Min Booking Fee,
    // Cancellation Fee, and Peak Hour Multiplier exactly as configured.
    // NOTE: `minBookingFee` here holds the per-CATEGORY minimum charge
    // (ServiceCategory.baseCharge, set in the admin panel's Categories
    // screen for that specific labour category) — there is no longer a
    // single global minimum booking fee.
    billing: {
      baseCost:                 { type: Number, default: 0 },
      costRate:                 { type: Number, default: 0 },
      costRateAmount:           { type: Number, default: 0 },
      peakHourApplied:          { type: Boolean, default: false },
      peakHourMultiplier:       { type: Number, default: 1 },
      minBookingFeeApplied:     { type: Boolean, default: false },
      minBookingFee:            { type: Number, default: 0 },
      serviceCharge:            { type: Number, default: 0 },
      platformCommission:       { type: Number, default: 0 },
      platformCommissionAmount: { type: Number, default: 0 },
      cancellationFee:          { type: Number, default: 0 },
    },

    // ── Quick Auto Book ──────────────────────────────────────────────────
    // When true, this booking was broadcast to every nearby worker in the
    // category. Workers accept independently (workerStatuses) until
    // `requiredWorkers` slots are filled; the top-level `status` stays
    // 'pending' throughout recruiting and only becomes 'accepted' once
    // fully staffed (or 'cancelled' if the customer cancels with 0 accepts).
    isAutobook:      { type: Boolean, default: false },
    requiredWorkers: { type: Number, default: null },
    workerStatuses: [{
      worker:         { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'expired', 'arrived', 'in_progress', 'awaiting_customer_confirmation', 'completed', 'cancelled'],
        default: 'pending',
      },
      workerSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
      acceptedAt:     { type: Date, default: null },
      checkInTime:    { type: Date, default: null },
      workStartTime:  { type: Date, default: null },
      checkOutTime:   { type: Date, default: null },
      hoursWorked:    { type: Number, default: null },
      hourlyRate:     { type: Number, default: null },
      baseFeeApplied: { type: Boolean, default: false },
      subtotal:       { type: Number, default: 0 },
      total:          { type: Number, default: 0 },
      // Per-worker billing breakdown (autobook) — populated on customer
      // confirmation only, mirroring the top-level `billing` block, so the
      // status card can show surge/service/gst/platform per worker once
      // that worker's job is confirmed complete.
      billing: {
        costRate:                 { type: Number, default: 0 },
        costRateAmount:           { type: Number, default: 0 },
        peakHourMultiplier:       { type: Number, default: 1 },
        serviceCharge:            { type: Number, default: 0 },
        platformCommission:       { type: Number, default: 0 },
        platformCommissionAmount: { type: Number, default: 0 },
        cancellationFee:          { type: Number, default: 0 },
      },
      paymentMethod:  { type: String, default: null },
    }],

    // Status
    status: {
      type: String,
      enum: ['pending', 'accepted', 'arrived', 'in_progress', 'awaiting_customer_confirmation', 'completed', 'cancelled'],
      default: 'pending',
    },

    scheduledDate:    { type: Date, default: null },   // start date (or single date)
    scheduledEndDate: { type: Date, default: null },   // end date for multi-day bookings
    scheduledDates:   { type: [Date], default: [] },   // every individual day booked
    totalDays:        { type: Number, default: 1 },
    isImmediate:      { type: Boolean, default: true },
    acceptedAt:    { type: Date, default: null },
    checkInTime:   { type: Date, default: null },
    checkOutTime:  { type: Date, default: null },
    workStartTime: { type: Date, default: null },   // when worker actually starts the job (status → in_progress)
    hoursWorked:   { type: Number, default: null },  // billed hours for immediate/hourly bookings
    hourlyRate:    { type: Number, default: null },  // combined per-hour rate of assigned workers
    // true when hoursWorked < 1hr and the admin's min booking fee floor was
    // applied instead of a straight hourly calculation, at final billing.
    baseFeeApplied: { type: Boolean, default: false },
    workerCancelled: { type: Boolean, default: false },
    notes:         { type: String, default: '' },
    description:   { type: String, default: '' },

    // Issue Reporting
    issueReport: {
      comment: { type: String, default: '' },
      reportedAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

// getMyBookings: user sorted by newest first (most common customer query)
bookingSchema.index({ user: 1, createdAt: -1 });

// active bookings count in getMe
bookingSchema.index({ user: 1, status: 1 });

// BP worker fetching their bookings sorted by time
bookingSchema.index({ workers: 1, status: 1, createdAt: -1 });

// worker history sorted by updatedAt
bookingSchema.index({ workers: 1, status: 1, updatedAt: -1 });

// dashboard/admin status queries
bookingSchema.index({ status: 1, createdAt: -1 });

// autobook: find this worker's pending candidate requests fast
bookingSchema.index({ isAutobook: 1, 'workerStatuses.worker': 1, 'workerStatuses.status': 1 });

module.exports = mongoose.model('Booking', bookingSchema);
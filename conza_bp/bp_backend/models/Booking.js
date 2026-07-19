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

    // Quick Auto Book — request broadcast to every nearby worker in the
    // category; first `requiredWorkers` to accept get assigned to `workers`.
    isAutoBook:         { type: Boolean, default: false },
    requiredWorkers:    { type: Number, default: 0 },
    requestedWorkerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],

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

    // Status
    status: {
      type: String,
      enum: ['pending', 'accepted', 'arrived', 'in_progress', 'awaiting_customer_confirmation', 'completed', 'cancelled'],
      default: 'pending',
    },

    scheduledDate:    { type: Date, default: null },
    scheduledEndDate: { type: Date, default: null },
    scheduledDates:   { type: [Date], default: [] },
    totalDays:        { type: Number, default: 1 },
    isImmediate:      { type: Boolean, default: true },
    acceptedAt:    { type: Date, default: null },
    checkInTime:   { type: Date, default: null },
    checkOutTime:  { type: Date, default: null },
    workStartTime: { type: Date, default: null },   // when worker actually starts the job (status → in_progress)
    hoursWorked:   { type: Number, default: null },  // billed hours for immediate/hourly bookings (0 = base fee applied)
    hourlyRate:    { type: Number, default: null },  // combined per-hour rate of assigned workers
    baseFeeApplied: { type: Boolean, default: false }, // true when work ≤ 1 hr and base charge was billed
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

// getWorkerRequests: workers array + pending status, sorted by createdAt
bookingSchema.index({ workers: 1, status: 1, createdAt: -1 });

// Quick Auto Book — worker checking their broadcast pool for pending requests
bookingSchema.index({ requestedWorkerIds: 1, status: 1 });

// getWorkerHistory: workers + completed/cancelled, sorted by updatedAt
bookingSchema.index({ workers: 1, status: 1, updatedAt: -1 });

// getBookingById: single lookup by _id (default _id index covers this — no extra needed)
// status-only dashboard queries
bookingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);

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
      type: String, enum: ['cod', 'upi', 'card'], default: 'cod',
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'accepted', 'arrived', 'completed', 'cancelled'],
      default: 'pending',
    },

    scheduledDate: { type: Date, default: null },
    isImmediate:   { type: Boolean, default: true },
    acceptedAt:    { type: Date, default: null },
    checkInTime:   { type: Date, default: null },
    checkOutTime:  { type: Date, default: null },
    workerCancelled: { type: Boolean, default: false },
    notes:         { type: String, default: '' },
    description:   { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    bookingType: {
      type: String, required: true, enum: ['labour', 'material', 'rental'],
    },

    // For labour bookings
    workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
    workerSnapshot: [mongoose.Schema.Types.Mixed],
    category: { type: String, default: '' },

    // Address
    houseNumber: { type: String, default: '' },
    houseName:   { type: String, default: '' },
    street:      { type: String, default: '' },
    address:     { type: String }, 
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
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },

    scheduledDate: { type: Date, default: null },
    isImmediate:   { type: Boolean, default: true },
    notes:         { type: String, default: '' },
    description:   { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);

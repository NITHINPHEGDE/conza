const mongoose = require('mongoose')

// One document per category ('labour', 'materials', 'rentals').
// `settings` holds the category-specific key/value pairs set from
// Finance → Pricing Management in the admin panel (e.g. for labour:
// platformCommission, costRate, serviceCharge, minBookingFee,
// cancellationFee, peakHourMultiplier). Kept as Mixed so each category
// can evolve its own field set without a schema migration.
const pricingConfigSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['labour', 'materials', 'rentals'],
    required: true,
    unique: true,
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {},
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  updatedByAdmin: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('PricingConfig', pricingConfigSchema)

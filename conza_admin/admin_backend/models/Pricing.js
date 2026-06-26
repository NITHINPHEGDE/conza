const mongoose = require('mongoose')

const pricingSchema = new mongoose.Schema({
  category: { type: String, required: true },
  type: { type: String, enum: ['labour', 'material', 'rental'], default: 'labour' },
  baseCharge: { type: Number, required: true },
  platformFee: { type: Number, default: 0 },
  platformFeeType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
  commissionRate: { type: Number, default: 15 },
  minCharge: { type: Number, default: 0 },
  surgePricing: { type: Boolean, default: false },
  surgeMultiplier: { type: Number, default: 1 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true })

module.exports = mongoose.model('Pricing', pricingSchema)

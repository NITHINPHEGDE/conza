const mongoose = require('mongoose')

const promotionSchema = new mongoose.Schema({
  type: { type: String, enum: ['coupon', 'cashback', 'referral', 'seasonal'], required: true },
  code: { type: String, sparse: true, uppercase: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  discountType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
  discountValue: { type: Number, default: 0 },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 },
  usageLimit: { type: Number, default: 0 },
  usedCount: { type: Number, default: 0 },
  validFrom: { type: Date },
  validTo: { type: Date },
  status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
  applicableTo: { type: String, enum: ['all', 'customers', 'workers', 'vendors'], default: 'all' },
}, { timestamps: true })

module.exports = mongoose.model('Promotion', promotionSchema)

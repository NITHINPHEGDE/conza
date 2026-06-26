const mongoose = require('mongoose')

const businessPartnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, lowercase: true },
  territory: { type: String, default: '' },
  city: { type: String, default: '' },
  commissionRate: { type: Number, default: 5 },
  totalReferrals: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'pending_verification'], default: 'pending_verification' },
  isVerified: { type: Boolean, default: false },
  memberSince: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('BusinessPartner', businessPartnerSchema)

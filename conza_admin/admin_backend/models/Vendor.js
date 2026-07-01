const mongoose = require('mongoose')
const sellersDB = require('../config/sellersDb')

// Schema mirrors conza_vendor/sellerb/models/Seller.js, bound to the
// SEPARATE sellers MongoDB connection (SELLERS_MONGO_URI), reading the real
// "sellers" collection created by the vendor app. Admin-managed fields
// (status, isVerified) are added here with safe defaults so existing
// vendor-app documents (which don't have them) still hydrate fine, and the
// admin panel can write them back onto the same real documents.
const vendorSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  phone: { type: String },
  email: { type: String, lowercase: true },
  password: { type: String, select: false },
  profileImage: { type: String, default: null },
  shopName: { type: String },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  pincode: { type: String, default: '' },
  gstNumber: { type: String, default: '' },
  licenseNo: { type: String, default: '' },
  sellerType: { type: String, enum: ['material', 'rental', 'both'], default: 'both' },
  walletBalance: { type: Number, default: 0 },
  memberSince: { type: String, default: '' },

  // Admin-managed
  status: { type: String, enum: ['active', 'suspended', 'inactive', 'pending_verification'], default: 'pending_verification' },
  isVerified: { type: Boolean, default: false },

  // Display-only aggregates
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
}, {
  timestamps: true,
  collection: 'sellers',
  strict: false,
  autoIndex: false,
})

vendorSchema.index({ name: 'text', shopName: 'text', phone: 1, status: 1 })

module.exports = sellersDB.model('Vendor', vendorSchema)

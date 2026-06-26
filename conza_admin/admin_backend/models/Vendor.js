const mongoose = require('mongoose')

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, unique: true, sparse: true, lowercase: true },
  phone: { type: String, required: true },
  email: { type: String, lowercase: true },
  profileImage: { type: String, default: null },
  shopName: { type: String, required: true },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  pincode: { type: String, default: '' },
  gstNumber: { type: String, default: '' },
  licenseNo: { type: String, default: '' },
  sellerType: { type: String, enum: ['material', 'rental', 'both'], default: 'material' },
  walletBalance: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'suspended', 'inactive', 'pending_verification'], default: 'pending_verification' },
  isVerified: { type: Boolean, default: false },
  memberSince: { type: String, default: '' },
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
}, { timestamps: true })

vendorSchema.index({ name: 'text', shopName: 'text', phone: 1, status: 1 })

module.exports = mongoose.model('Vendor', vendorSchema)

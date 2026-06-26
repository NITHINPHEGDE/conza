const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
  label: String,
  address: String,
  city: String,
  pincode: String,
}, { _id: false })

const customerSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String, lowercase: true, trim: true },
  profileImage: { type: String, default: null },
  locationText: { type: String, default: '' },
  status: { type: String, enum: ['active', 'suspended', 'inactive'], default: 'active' },
  memberSince: { type: String, default: '' },
  totalBookings: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },
  savedAddresses: { type: [addressSchema], default: [] },
}, { timestamps: true })

customerSchema.index({ fullName: 'text', phone: 1, email: 1 })

module.exports = mongoose.model('Customer', customerSchema)
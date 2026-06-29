const mongoose = require('mongoose')
const customersDB = require('../config/customersDb')

const addressSchema = new mongoose.Schema({
  label: String,
  address: String,
  city: String,
  pincode: String,
}, { _id: false })

// Schema mirrors conza_customers/conza_backend/models/User.js, bound to the
// SEPARATE customers MongoDB connection (CUSTOMERS_MONGO_URI), reading the
// real "users" collection created by the customer app.
const customerSchema = new mongoose.Schema({
  fullName: { type: String, trim: true },
  username: { type: String, lowercase: true, trim: true },
  phone: { type: String },
  email: { type: String, lowercase: true, trim: true },
  password: { type: String, select: false },
  profileImage: { type: String, default: null },
  locationText: { type: String, default: '' },
  status: { type: String, enum: ['active', 'suspended', 'inactive'], default: 'active' },
  memberSince: { type: String, default: '' },
  totalBookings: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },
  savedAddresses: { type: [addressSchema], default: [] },
}, {
  timestamps: true,
  collection: 'users',
  strict: false,
  autoIndex: false,
})

module.exports = customersDB.model('Customer', customerSchema)
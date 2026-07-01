const mongoose = require('mongoose')
const workersDB = require('../config/workersDb')

// Schema mirrors conza_bp/bp_backend/models/Worker.js, bound to the SEPARATE
// workers MongoDB connection (WORKERS_MONGO_URI), reading the real "workers"
// collection created by the workers app. Admin-only fields (status,
// isVerified, verification, earnings) are added here with safe defaults so
// existing worker-app documents (which don't have them) still hydrate fine,
// and the admin panel can write them back onto the same real documents.
const workerSchema = new mongoose.Schema({
  fullName: { type: String, trim: true },
  username: { type: String, lowercase: true, trim: true },
  phone: { type: String },
  email: { type: String, lowercase: true, trim: true },
  password: { type: String, select: false },
  profileImage: { type: String, default: null },

  category: { type: String },
  skills: { type: [String], default: [] },
  minCharge: { type: Number, default: null },
  locationText: { type: String, default: '' },
  experience: { type: Number, default: null },
  bio: { type: String, default: '' },

  isOnline: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },

  rating: { type: Number, default: 5.0 },
  totalJobs: { type: Number, default: 0 },
  memberSince: { type: String, default: '' },

  // Admin-managed fields
  status: { type: String, enum: ['active', 'suspended', 'pending_verification'], default: 'pending_verification' },
  isVerified: { type: Boolean, default: false },
  verification: {
    aadhaar: { type: Boolean, default: false },
    pan: { type: Boolean, default: false },
    bank: { type: Boolean, default: false },
    documents: { type: Boolean, default: false },
  },
  earnings: {
    total: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
  collection: 'workers',
  strict: false,
  autoIndex: false,
})

module.exports = workersDB.model('Worker', workerSchema)

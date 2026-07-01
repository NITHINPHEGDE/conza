const mongoose = require('mongoose')
const customersDB = require('../config/customersDb')

const workerSnapshotSchema = new mongoose.Schema({
  name: String,
  pricePerDay: Number,
}, { _id: false })

const issueReportSchema = new mongoose.Schema({
  comment: { type: String, default: '' },
  reportedAt: { type: Date, default: null },
}, { _id: false })

const bookingSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },      // ObjectId ref to Customer
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },      // kept for back-compat
  workers:  { type: [mongoose.Schema.Types.ObjectId], ref: 'Worker', default: [] }, // real docs store ObjectId, not String
  workerSnapshot: { type: mongoose.Schema.Types.Mixed, default: [] },
  category: { type: String, required: true },
  bookingType: { type: String, enum: ['labour', 'material', 'rental'], default: 'labour' },
  houseNumber: { type: String, default: '' },
  houseName: { type: String, default: '' },
  street: { type: String, default: '' },
  area: { type: String, default: '' },
  city: { type: String, default: '' },
  district: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  subtotal: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'upi' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed', 'arrived'],
    default: 'pending',
  },
  scheduledDate: { type: Date, default: null },
  isImmediate: { type: Boolean, default: true },
  acceptedAt: { type: Date, default: null },
  checkInTime: { type: Date, default: null },
  checkOutTime: { type: Date, default: null },
  notes: { type: String, default: '' },
  description: { type: String, default: '' },
  issueReport: { type: issueReportSchema, default: {} },
  disputeResolution: { type: String, default: '' },
}, { timestamps: true, strict: false })

bookingSchema.index({ user: 1, status: 1, bookingType: 1 })

module.exports = customersDB.model('Booking', bookingSchema)
const mongoose = require('mongoose')
const customersDB = require('../config/customersDb')

// Reviews are written by conza_customers/conza_backend into ITS database
// (CUSTOMERS_MONGO_URI), not the admin panel's own database. Schema mirrors
// conza_customers/conza_backend/models/Review.js exactly, bound to the
// SEPARATE customers MongoDB connection so this reads the real "reviews"
// collection created by the customer app — same pattern as Customer.js,
// Worker.js, and Vendor.js.
const reviewSchema = new mongoose.Schema({
  entityType: { type: String, enum: ['worker', 'vendor', 'product'], required: true },
  entityId: { type: String, required: true },
  entityName: { type: String, default: '' },
  bookingId: { type: String, default: null },
  customer: { type: String, required: true },
  customerId: { type: String },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  status: { type: String, enum: ['published', 'hidden', 'flagged', 'pending'], default: 'published' },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true, collection: 'reviews' })

reviewSchema.index({ entityType: 1, entityId: 1, createdAt: -1 })
reviewSchema.index({ bookingId: 1 })

module.exports = customersDB.model('Review', reviewSchema)

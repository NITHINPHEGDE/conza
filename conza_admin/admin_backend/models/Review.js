const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  entityType: { type: String, enum: ['worker', 'vendor', 'product'], required: true },
  entityId: { type: String, required: true },
  entityName: { type: String, default: '' },
  customer: { type: String, required: true },
  customerId: { type: String },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  status: { type: String, enum: ['published', 'hidden', 'flagged', 'pending'], default: 'published' },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.model('Review', reviewSchema)

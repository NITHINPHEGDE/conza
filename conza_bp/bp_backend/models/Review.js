const mongoose = require('mongoose');

// Shared `reviews` collection — read here (labour/partner app, Profile →
// Reviews & Ratings). Written by conza_customers once a booking is
// confirmed as completed. Field names must match the conza_customers and
// conza_admin copies of this model exactly.
const reviewSchema = new mongoose.Schema(
  {
    entityType: { type: String, enum: ['worker', 'vendor', 'product'], required: true },
    entityId:   { type: String, required: true },
    entityName: { type: String, default: '' },
    bookingId:  { type: String, default: null },
    customer:   { type: String, required: true },
    customerId: { type: String },
    rating:     { type: Number, min: 1, max: 5, required: true },
    comment:    { type: String, default: '' },
    status:     { type: String, enum: ['published', 'hidden', 'flagged', 'pending'], default: 'published' },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
reviewSchema.index({ bookingId: 1 });

module.exports = mongoose.model('Review', reviewSchema);

const mongoose = require('mongoose');

// Shared `reviews` collection — written here (customer app, source of
// truth for ratings/reviews), read by conza_admin (Operations → Bookings,
// Users → Worker → Actions → View Reviews & Ratings) and conza_bp
// (Partner Profile → Reviews & Ratings). Field names must match the
// admin_backend and bp_backend copies of this model exactly.
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
// Unique per (booking × worker) so upsert is safe from race-condition
// duplicate-key errors (concurrent resubmissions hit the same doc).
reviewSchema.index({ bookingId: 1, entityType: 1, entityId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

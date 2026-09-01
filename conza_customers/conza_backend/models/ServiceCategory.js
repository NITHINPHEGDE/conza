const mongoose = require('mongoose');

// Read-only mirror of the categories created in the admin panel.
// Lives on the same shared database as this app's own MONGO_URI.
const serviceCategorySchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  image:       { type: String, required: true },
  commission:  { type: Number, default: 15 },
  radius:      { type: Number, default: 5 },
  workers:     { type: Number, default: 0 },
  bookings:    { type: Number, default: 0 },
  active:      { type: Boolean, default: true },
  description: { type: String, default: '' },

  // ── Admin-set pricing for this category (Finance → Categories) ────────
  // Mirrors conza_admin/admin_backend/models/ServiceCategory.js exactly —
  // same field names, same shared database — so the per-category Base
  // Price is available here for final billing at job confirmation.
  baseCharge:    { type: Number, default: 0, min: 0 }, // fixed call-out / base fee (< 1 hr jobs)
  perHourCharge: { type: Number, default: 0, min: 0 }, // rate per hour
  perDayCharge:  { type: Number, default: 0, min: 0 }, // rate per day
}, { timestamps: true });

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema);

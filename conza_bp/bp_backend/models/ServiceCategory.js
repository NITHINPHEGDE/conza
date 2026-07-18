const mongoose = require('mongoose');

// Read-only mirror of the categories created in the admin panel.
// Lives on the same shared database as this app's own MONGO_URI
// (the admin panel writes to it via its secondary WORKERS_MONGO_URI connection).
const serviceCategorySchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  image:       { type: String, required: true },
  commission:  { type: Number, default: 15 },
  radius:      { type: Number, default: 5 },
  workers:     { type: Number, default: 0 },
  bookings:    { type: Number, default: 0 },
  active:      { type: Boolean, default: true },
  description: { type: String, default: '' },

  // ── Admin-set pricing for this category (mirrors conza_admin) ───────────
  // Business partners no longer set their own pricing at sign-up. The admin
  // sets three rates for the whole category, and every worker registering
  // under this category is auto-priced with these values.
  baseCharge:    { type: Number, default: 0, min: 0 }, // fixed call-out / base fee
  perHourCharge: { type: Number, default: 0, min: 0 }, // rate per hour
  perDayCharge:  { type: Number, default: 0, min: 0 }, // rate per day
}, { timestamps: true });

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema);
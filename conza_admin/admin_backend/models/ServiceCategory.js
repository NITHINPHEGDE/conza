const mongoose = require('mongoose')
const workersDB = require('../config/workersDb')

// Bound to the SAME shared workers database used by conza_bp (worker app) and
// conza_customers (customer app), so categories created here are visible to
// both apps immediately — mirrors how admin reads Worker docs from workersDB.
const serviceCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  image: { type: String, required: true },        // Cloudinary secure_url
  commission: { type: Number, default: 15 },
  radius: { type: Number, default: 5 },
  workers: { type: Number, default: 0 },
  bookings: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  description: { type: String, default: '' },

  // ── Admin-set pricing for this category ─────────────────────────────────
  // Admin sets three separate rates for the whole category; every worker
  // who registers under (or already belongs to) this category is priced
  // accordingly. See serviceCategoryController.updateCategory and
  // conza_bp workerService.signUpWorker.
  baseCharge:    { type: Number, default: 0, min: 0 }, // fixed call-out / base fee
  perHourCharge: { type: Number, default: 0, min: 0 }, // rate per hour
  perDayCharge:  { type: Number, default: 0, min: 0 }, // rate per day
}, { timestamps: true })

module.exports = workersDB.model('ServiceCategory', serviceCategorySchema)
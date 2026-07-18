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
  // Business partners can no longer set their own pricing at sign-up — the
  // admin sets a base charge per hour and per day for the whole category,
  // and every worker who registers under (or already belongs to) this
  // category is priced accordingly. See serviceCategoryController.updateCategory
  // and conza_bp workerService.signUpWorker.
  perHourCharge: { type: Number, default: 0, min: 0 },
  perDayCharge: { type: Number, default: 0, min: 0 },
}, { timestamps: true })

module.exports = workersDB.model('ServiceCategory', serviceCategorySchema)
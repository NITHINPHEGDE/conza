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
}, { timestamps: true })

module.exports = workersDB.model('ServiceCategory', serviceCategorySchema)

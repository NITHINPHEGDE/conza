const mongoose = require('mongoose')

const serviceCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  baseCharge: { type: Number, required: true },
  commission: { type: Number, default: 15 },
  radius: { type: Number, default: 5 },
  workers: { type: Number, default: 0 },
  bookings: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  icon: { type: String, default: '' },
  description: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema)

const mongoose = require('mongoose')
const sellersDB = require('../config/sellersDb')

// Mirrors conza_vendor/sellerb/models/Product.js (and conza_customers' copy of it),
// bound to the SAME sellers MongoDB connection + 'products' collection.
// This means admin reads/writes the exact real documents the vendor app and
// customer app use — no separate "admin copy" of the data, no sync needed.
// isFeatured is admin-managed and additive (safe default for existing docs).
const productSchema = new mongoose.Schema({
  seller:        { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },

  title:         { type: String, trim: true },
  description:   { type: String, default: '' },
  brand:         { type: String, default: '' },
  category:      { type: String, default: '' },
  unit:          { type: String, default: 'piece' },

  type:          { type: String, enum: ['material', 'rental'] },

  price:         { type: Number, default: 0 },
  rentalPrice:   { type: Number, default: null },
  deposit:       { type: Number, default: 0 },
  minRentalDays: { type: Number, default: 1 },

  stock:         { type: Number, default: 0 },
  sold:          { type: Number, default: 0 },
  sku:           { type: String, default: '' },
  minOrder:      { type: Number, default: 1 },
  weight:        { type: String, default: '' },
  hsnCode:       { type: String, default: '' },

  images:        { type: [String], default: [] },
  isAvailable:   { type: Boolean, default: true },
  lowStockAt:    { type: Number, default: 5 },

  // Admin-managed
  isFeatured:    { type: Boolean, default: false },
}, {
  timestamps: true,
  collection: 'products',
  strict: false,
  autoIndex: false,
})

module.exports = sellersDB.model('Product', productSchema)

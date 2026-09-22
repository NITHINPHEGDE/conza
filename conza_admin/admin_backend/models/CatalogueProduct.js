const mongoose = require('mongoose')
const sellersDB = require('../config/sellersDb')

// Admin-managed master catalogue of materials.
//
// Lives in the SAME shared sellers database as the vendors' 'products'
// collection (mirrors models/Product.js), so the vendor backend
// (conza_vendor/sellerb) can read it directly from its own connection —
// no sync job or duplicate storage needed.
//
// Vendors never edit these fields. When a vendor lists a catalogue product,
// the vendor backend copies name/brand/sku/description/category/unit/images
// into the vendor's own product listing and stores a `catalogueProduct`
// reference back to this document. The vendor only supplies pricing, stock
// and additional details.
const UNITS = ['bag', 'piece', 'ton', 'kg', 'litre', 'box', 'roll', 'sheet', 'set', 'meter']

const catalogueProductSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 150 },
  brand:       { type: String, default: '', trim: true, maxlength: 100 },
  sku:         { type: String, default: '', trim: true, maxlength: 50 },
  description: { type: String, default: '', trim: true, maxlength: 2000 },

  // Category NAME (same convention as Product.category) + reference to the
  // MaterialCategory it was picked from.
  category:    { type: String, required: true, trim: true },
  categoryId:  { type: mongoose.Schema.Types.ObjectId, default: null },

  unit:        { type: String, enum: UNITS, default: 'piece' },

  images: {
    type: [String],
    default: [],
    validate: [(v) => v.length <= 5, 'A product can have at most 5 images.'],
  },

  // Inactive products are hidden from the vendor search dropdown.
  isActive:    { type: Boolean, default: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, default: null },
}, {
  timestamps: true,
  collection: 'catalogueproducts',
  autoIndex: false,
})

const CatalogueProduct = sellersDB.model('CatalogueProduct', catalogueProductSchema)
CatalogueProduct.UNITS = UNITS

module.exports = CatalogueProduct

// conzasb/models/CatalogueProduct.js
//
// Read model for the admin-managed product catalogue.
// Mirrors conza_admin/admin_backend/models/CatalogueProduct.js and is bound
// to the SAME MongoDB database as this service's own connection (config/db.js)
// — the admin panel writes into the 'catalogueproducts' collection on that
// shared sellers database, so this service reads the exact same documents,
// no sync needed.
const mongoose = require('mongoose');

const catalogueProductSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    brand:       { type: String, default: '' },
    sku:         { type: String, default: '' },
    description: { type: String, default: '' },
    category:    { type: String, required: true },
    categoryId:  { type: mongoose.Schema.Types.ObjectId, default: null },
    unit:        { type: String, default: 'piece' },
    images:      { type: [String], default: [] },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'catalogueproducts', strict: false }
);

module.exports = mongoose.model('CatalogueProduct', catalogueProductSchema);

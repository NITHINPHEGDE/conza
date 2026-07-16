// conzacsb/models/MaterialCategory.js
const mongoose = require('mongoose');

// Read-only mirror of the material categories managed in the admin panel.
// Lives on the same shared database as this app's products collection, so
// categories created in conza_admin are visible here immediately.
const materialCategorySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  image:       { type: String, required: true },        // Cloudinary secure_url
  active:      { type: Boolean, default: true },
  description: { type: String, default: '' },
}, { timestamps: true, collection: 'materialcategories' });

module.exports = mongoose.model('MaterialCategory', materialCategorySchema);

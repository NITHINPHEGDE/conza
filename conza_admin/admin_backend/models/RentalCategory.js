const mongoose = require('mongoose')
const sellersDB = require('../config/sellersDb')

// Bound to the SAME shared sellers database as the products collection
// (mirrors models/Product.js), so categories created in the admin panel are
// readable by the customer app (conza_customers/conza_backend) from its own
// connection to this database — no sync needed.
const rentalCategorySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  image:       { type: String, required: true },        // Cloudinary secure_url
  active:      { type: Boolean, default: true },
  description: { type: String, default: '' },
}, {
  timestamps: true,
  collection: 'rentalcategories',
  autoIndex: false,
})

module.exports = sellersDB.model('RentalCategory', rentalCategorySchema)

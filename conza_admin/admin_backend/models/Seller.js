const mongoose = require('mongoose')
const customersDB = require('../config/customersDb')

const sellerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  shopName: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
}, { timestamps: true, collection: 'sellers', strict: false })

module.exports = customersDB.model('Seller', sellerSchema)

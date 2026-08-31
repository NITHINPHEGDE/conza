const mongoose = require('mongoose');
const adminDB = require('../config/adminDb');

// Schema mirrors conza_admin/admin_backend/models/PricingConfig.js, bound to
// the SEPARATE admin MongoDB connection (ADMIN_MONGO_URI), reading the real
// "pricingconfigs" collection maintained by the admin panel.
const pricingConfigSchema = new mongoose.Schema({
  category: { type: String, enum: ['labour', 'materials', 'rentals'] },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, default: 'active' },
}, {
  timestamps: true,
  collection: 'pricingconfigs',
  strict: false,
  autoIndex: false,
});

module.exports = adminDB.model('PricingConfigAdmin', pricingConfigSchema);

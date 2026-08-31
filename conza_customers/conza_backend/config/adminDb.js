const mongoose = require('mongoose');

// Secondary connection — the admin panel (conza_admin/admin_backend) runs on
// its OWN MongoDB URI, separate from this app's MONGO_URI. This connects to
// that admin database so the customer backend can read the real labour
// pricing config (Platform Commission, Cost Rate, Service Charge, Min
// Booking Fee, Cancellation Fee, Peak Hour Multiplier) set from
// Finance → Pricing Management in the admin panel.
// Mirrors the same pattern the admin backend already uses in
// conza_admin/admin_backend/config/customersDb.js.
const adminDB = mongoose.createConnection(process.env.ADMIN_MONGO_URI);

adminDB.on('connected', () => {
  console.log('Admin MongoDB connected');
});

adminDB.on('error', (err) => {
  console.error('Admin MongoDB connection error:', err);
});

module.exports = adminDB;

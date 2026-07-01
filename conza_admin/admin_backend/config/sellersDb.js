const mongoose = require('mongoose')

// Secondary connection — the vendor-facing app (conza_vendor/sellerb) runs
// on its OWN MongoDB URI, separate from the admin panel's MONGO_URI.
// This connects to that vendor database so the admin panel can read the
// real registered vendors from its "sellers" collection.
const sellersDB = mongoose.createConnection(process.env.SELLERS_MONGO_URI)

sellersDB.on('connected', () => {
  console.log('Sellers MongoDB connected')
})

sellersDB.on('error', (err) => {
  console.error('Sellers MongoDB connection error:', err)
})

module.exports = sellersDB

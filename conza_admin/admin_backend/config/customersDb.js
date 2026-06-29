const mongoose = require('mongoose')

// Secondary connection — the customer-facing app (conza_customers/conza_backend)
// runs on its OWN MongoDB URI, separate from the admin panel's MONGO_URI.
// This connects to that customers database so the admin panel can read the
// real registered customers from its "users" collection.
const customersDB = mongoose.createConnection(process.env.CUSTOMERS_MONGO_URI)

customersDB.on('connected', () => {
  console.log('Customers MongoDB connected')
})

customersDB.on('error', (err) => {
  console.error('Customers MongoDB connection error:', err)
})

module.exports = customersDB

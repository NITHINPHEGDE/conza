const mongoose = require('mongoose')

// Secondary connection — the workers app (conza_bp/bp_backend) runs on its
// OWN MongoDB URI, separate from the admin panel's MONGO_URI.
// This connects to that workers database so the admin panel can read the
// real registered workers from its "workers" collection.
const workersDB = mongoose.createConnection(process.env.WORKERS_MONGO_URI)

workersDB.on('connected', () => {
  console.log('Workers MongoDB connected')
})

workersDB.on('error', (err) => {
  console.error('Workers MongoDB connection error:', err)
})

module.exports = workersDB

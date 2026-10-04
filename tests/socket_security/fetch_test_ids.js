/**
 * fetch_test_ids.js
 * Connects to MongoDB and pulls real IDs for test fixtures.
 * Run once: node fetch_test_ids.js
 */
'use strict';

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '.env.test') });
require('dotenv').config({ path: require('path').join(__dirname, '../../conza_customers/conza_backend/.env') });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Error: MONGO_URI environment variable is required.');
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection;

  // ── Users (customers) ────────────────────────────────────────────────────
  const users = await db.collection('users')
    .find({}, { projection: { _id: 1, fullName: 1, status: 1 } })
    .sort({ createdAt: -1 })
    .limit(3)
    .toArray();

  // ── Workers ──────────────────────────────────────────────────────────────
  const workers = await db.collection('workers')
    .find({}, { projection: { _id: 1, fullName: 1, status: 1 } })
    .sort({ createdAt: -1 })
    .limit(3)
    .toArray();

  // ── Sellers ──────────────────────────────────────────────────────────────
  const sellers = await db.collection('sellers')
    .find({}, { projection: { _id: 1, businessName: 1, status: 1 } })
    .sort({ createdAt: -1 })
    .limit(3)
    .toArray();

  // ── Bookings ─────────────────────────────────────────────────────────────
  const bookings = await db.collection('bookings')
    .find({}, { projection: { _id: 1, user: 1, workers: 1, workerStatuses: 1, status: 1 } })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  console.log('\n=== USERS (customers) ===');
  users.forEach(u => console.log(`  ${u._id}  ${u.fullName}  [${u.status}]`));

  console.log('\n=== WORKERS ===');
  workers.forEach(w => console.log(`  ${w._id}  ${w.fullName}  [${w.status}]`));

  console.log('\n=== SELLERS ===');
  sellers.forEach(s => console.log(`  ${s._id}  ${s.businessName}  [${s.status}]`));

  console.log('\n=== BOOKINGS (recent 10) ===');
  bookings.forEach(b => {
    const workerIds = [
      ...(b.workers || []).map(w => w.toString()),
      ...(b.workerStatuses || []).map(ws => ws.worker?.toString()).filter(Boolean)
    ];
    console.log(`  ${b._id}  user=${b.user}  workers=[${workerIds.join(', ')}]  status=${b.status}`);
  });

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });

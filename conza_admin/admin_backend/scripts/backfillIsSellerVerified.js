/**
 * backfillIsSellerVerified.js
 *
 * ONE-TIME migration script. Run once after deploying Issue #19 changes.
 *
 *   node conza_admin/admin_backend/scripts/backfillIsSellerVerified.js
 *
 * Reads every Seller document and sets isSellerVerified=true on their products
 * when seller.isVerified === true && seller.status === 'active', and false otherwise.
 *
 * Safe to re-run: subsequent runs produce the same result (idempotent).
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const SELLERS_MONGO_URI = process.env.SELLERS_MONGO_URI;
if (!SELLERS_MONGO_URI) {
  console.error('❌  SELLERS_MONGO_URI not set in admin .env');
  process.exit(1);
}

async function run() {
  console.log('Connecting to database…');
  const conn = await mongoose.connect(SELLERS_MONGO_URI);
  console.log(`Connected: ${conn.connection.host}`);

  const db = mongoose.connection.db;
  const sellers = db.collection('sellers');
  const products = db.collection('products');

  const allSellers = await sellers.find({}, { projection: { _id: 1, isVerified: 1, status: 1 } }).toArray();
  console.log(`Found ${allSellers.length} sellers to process.`);

  let updated = 0;
  let errors = 0;

  for (const seller of allSellers) {
    const isProductVisible = seller.isVerified === true && seller.status === 'active';
    try {
      const result = await products.updateMany(
        { seller: seller._id },
        { $set: { isSellerVerified: isProductVisible } }
      );
      updated += result.modifiedCount;
      console.log(`  Seller ${seller._id}: isProductVisible=${isProductVisible} → ${result.modifiedCount} product(s) updated`);
    } catch (err) {
      errors++;
      console.error(`  ❌ Error updating seller ${seller._id}:`, err.message);
    }
  }

  console.log(`\nBackfill complete: ${updated} products updated, ${errors} errors.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

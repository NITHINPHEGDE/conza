// Run once: MONGO_URI="<paste your Railway MONGO_URI value>" node fixReviewIndexes.js
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

async function main() {
  if (!MONGO_URI) {
    console.error('Set MONGO_URI env var first.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  const collection = mongoose.connection.db.collection('reviews');

  const indexes = await collection.indexes();
  console.log('Current indexes on "reviews":');
  console.log(JSON.stringify(indexes, null, 2));

  const CORRECT_NAME = 'bookingId_1_entityType_1_entityId_1';

  for (const idx of indexes) {
    if (idx.name === '_id_') continue;

    const isCorrectCompoundUnique =
      idx.name === CORRECT_NAME &&
      idx.unique === true &&
      JSON.stringify(idx.key) === JSON.stringify({ bookingId: 1, entityType: 1, entityId: 1 });

    if (!isCorrectCompoundUnique) {
      console.log(`Dropping stale/incorrect index: ${idx.name} ->`, idx.key, idx.unique ? '(unique)' : '');
      await collection.dropIndex(idx.name);
    }
  }

  const refreshed = await collection.indexes();
  const hasCorrect = refreshed.some((i) => i.name === CORRECT_NAME);
  if (!hasCorrect) {
    console.log('Creating correct compound unique index...');
    await collection.createIndex(
      { bookingId: 1, entityType: 1, entityId: 1 },
      { unique: true, name: CORRECT_NAME }
    );
  }

  console.log('Final indexes on "reviews":');
  console.log(JSON.stringify(await collection.indexes(), null, 2));

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
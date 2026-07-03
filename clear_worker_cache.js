// Quick script to clear all worker-related Redis cache keys
// Run: node clear_worker_cache.js  (from conza_customers/conza_backend)
const Redis = require('ioredis');
const REDIS_URL = 'rediss://default:gQAAAAAAAYMvAAIgcDFjODY4NmM1NTM0YjQ0OTE1YjhjZmIyMWI1NTQ2Y2JiNw@merry-mouse-99119.upstash.io:6379';

const redis = new Redis(REDIS_URL, { tls: {} });

redis.on('connect', () => console.log('✅ Connected to Redis'));
redis.on('error', (e) => { console.error('❌ Redis error:', e.message); process.exit(1); });

(async () => {
  try {
    const patterns = ['workers:nearby:*', 'workers:categories:*', 'workers:search:*'];
    let totalDeleted = 0;

    for (const pattern of patterns) {
      let cursor = '0';
      const found = [];
      do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = next;
        found.push(...keys);
      } while (cursor !== '0');

      if (found.length) {
        await redis.del(...found);
        totalDeleted += found.length;
        console.log(`🗑️  Deleted ${found.length} keys matching "${pattern}"`);
      } else {
        console.log(`   No keys matching "${pattern}"`);
      }
    }

    console.log(`\n✅ Done. Total deleted: ${totalDeleted} cache keys.`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    redis.quit();
  }
})();

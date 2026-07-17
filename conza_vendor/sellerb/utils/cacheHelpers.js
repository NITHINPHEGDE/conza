// conzasb/utils/cacheHelpers.js
const { getRedis } = require('../config/redis');

/**
 * Delete cache keys (by exact key or `prefix*` pattern) from the shared
 * Redis instance also used by conza_backend (the customer-facing service).
 *
 * The vendor app writes products through this service (sellerb), while
 * customers read the public catalog through conza_backend, which caches
 * `getPublicProducts` responses for 60s. Because these are two separate
 * Node processes, conza_backend's in-process cache object is invisible
 * here — so without this cross-service invalidation, a newly added (or
 * updated/deleted) product would not appear in — or would leave a stale
 * copy inside — the customer catalog until that 60-second TTL expired.
 * Calling this after every write keeps both services in sync immediately.
 *
 * Failures are swallowed — never block a write operation, and never throw
 * if Redis is unreachable.
 */
const invalidateCache = async (...keys) => {
  const redis = getRedis();
  for (const key of keys) {
    try {
      if (key.endsWith('*')) {
        let cursor = '0';
        do {
          const [next, found] = await redis.scan(cursor, 'MATCH', key, 'COUNT', 100);
          cursor = next;
          if (found.length) await redis.del(...found);
        } while (cursor !== '0');
      } else {
        await redis.del(key);
      }
    } catch (_) {
      // Redis down / unreachable — never block the write path
    }
  }
};

module.exports = { invalidateCache };

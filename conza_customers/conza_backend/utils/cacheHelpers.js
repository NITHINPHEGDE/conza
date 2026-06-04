// conza_backend/utils/cacheHelpers.js
const { getRedis } = require('../config/redis');

const DEFAULT_TTL = 10; // seconds

/**
 * Generic cache-aside helper with stampede protection via a mutex lock.
 * Falls back transparently to `fetcher()` if Redis is unavailable.
 */
const withCache = async (key, ttl, fetcher) => {
  const redis = getRedis();

  // ── Try reading from cache ──────────────────────────────────────────────
  try {
    const cached = await redis.get(key);
    if (cached !== null) return JSON.parse(cached);
  } catch (_) {
    // Redis down — fall through to DB
    return fetcher();
  }

  // ── Stampede guard: acquire a short mutex lock ──────────────────────────
  const lockKey  = `lock:${key}`;
  const lockVal  = Date.now().toString();
  const lockTTL  = 2; // seconds
  let   acquired = false;

  try {
    const result = await redis.set(lockKey, lockVal, 'EX', lockTTL, 'NX');
    acquired = result === 'OK';
  } catch (_) {}

  if (!acquired) {
    // Another request is populating. Poll briefly then return DB fallback.
    await new Promise((r) => setTimeout(r, 100));
    try {
      const cached = await redis.get(key);
      if (cached !== null) return JSON.parse(cached);
    } catch (_) {}
    return fetcher();
  }

  // ── We hold the lock — fetch from DB and cache ──────────────────────────
  try {
    const data = await fetcher();

    // Null-cache protection: cache null too (short TTL)
    const storeValue = data !== undefined && data !== null ? data : null;
    const jitter     = Math.floor(Math.random() * 60); // avalanche prevention
    const finalTTL   = (storeValue === null ? 30 : ttl) + jitter;

    try {
      await redis.set(key, JSON.stringify(storeValue), 'EX', finalTTL);
    } catch (_) {}

    return data;
  } finally {
    try {
      // Release lock only if we still own it
      const current = await redis.get(lockKey);
      if (current === lockVal) await redis.del(lockKey);
    } catch (_) {}
  }
};

/**
 * Delete cache keys by exact key or by prefix pattern.
 * Failures are swallowed — never block a write operation.
 */
const invalidateCache = async (...keys) => {
  const redis = getRedis();
  for (const key of keys) {
    try {
      if (key.endsWith('*')) {
        // Pattern scan — use SCAN to avoid blocking KEYS
        let cursor = '0';
        do {
          const [next, found] = await redis.scan(cursor, 'MATCH', key, 'COUNT', 100);
          cursor = next;
          if (found.length) await redis.del(...found);
        } while (cursor !== '0');
      } else {
        await redis.del(key);
      }
    } catch (_) {}
  }
};

module.exports = { withCache, invalidateCache };
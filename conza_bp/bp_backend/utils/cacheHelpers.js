// bp_backend/utils/cacheHelpers.js
const { getRedis } = require('../config/redis');

const withCache = async (key, ttl, fetcher) => {
  const redis = getRedis();

  try {
    const cached = await redis.get(key);
    if (cached !== null) return JSON.parse(cached);
  } catch (_) {
    return fetcher();
  }

  const lockKey  = `lock:${key}`;
  const lockVal  = Date.now().toString();
  const lockTTL  = 2;
  let   acquired = false;

  try {
    const result = await redis.set(lockKey, lockVal, 'EX', lockTTL, 'NX');
    acquired = result === 'OK';
  } catch (_) {}

  if (!acquired) {
    await new Promise((r) => setTimeout(r, 100));
    try {
      const cached = await redis.get(key);
      if (cached !== null) return JSON.parse(cached);
    } catch (_) {}
    return fetcher();
  }

  try {
    const data     = await fetcher();
    const jitter   = Math.floor(Math.random() * 30);
    const finalTTL = (data === null ? 15 : ttl) + jitter;
    try {
      await redis.set(key, JSON.stringify(data ?? null), 'EX', finalTTL);
    } catch (_) {}
    return data;
  } finally {
    try {
      const current = await redis.get(lockKey);
      if (current === lockVal) await redis.del(lockKey);
    } catch (_) {}
  }
};

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
    } catch (_) {}
  }
};

module.exports = { withCache, invalidateCache };
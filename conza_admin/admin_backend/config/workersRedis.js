// conza_admin/admin_backend/config/workersRedis.js
//
// Thin Redis client that connects to the SAME Redis instance used by
// conza_bp/bp_backend. Used only for cache-busting admin operations
// (e.g. deleting worker:session:<id> when a worker is verified/suspended,
// and busting the customer-facing nearby/category worker caches so a
// suspended worker stops showing up to customers immediately).
//
// Falls back silently — if Redis is unavailable the admin action still succeeds;
// the workers backend's TTLs will expire naturally.

const Redis = require('ioredis')

let client = null

const getWorkersRedis = () => {
  if (client) return client

  const url = process.env.WORKERS_REDIS_URL
  if (!url) return null               // no URL configured → skip silently

  client = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableReadyCheck:     false,
    lazyConnect:          true,
    retryStrategy:        (times) => (times > 2 ? null : Math.min(times * 100, 500)),
  })

  client.on('error', () => {})        // swallow errors — this is best-effort

  return client
}

/**
 * Delete the worker session cache + customer-facing nearby/category caches
 * so that status changes (verified / suspended / activated) take effect on
 * the very next request instead of waiting for the cache TTL to expire.
 *
 * @param {string} workerId — Mongo ObjectId string
 * @param {string|string[]} [categories] — worker's category name(s), to bust category-scoped caches too
 */
const bustWorkerSessionCache = async (workerId, categories) => {
  try {
    const redis = getWorkersRedis()
    if (!redis) return
    await redis.del(`worker:session:${workerId}`)

    const list = Array.isArray(categories) ? categories.filter(Boolean) : (categories ? [categories] : [])

    const patterns = ['workers:nearby:*', 'workers:categories:*']
    list.forEach((cat) => patterns.push(`workers:search:${cat.toLowerCase()}:*`))

    for (const pattern of patterns) {
      let cursor = '0'
      do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
        cursor = next
        if (keys.length) await redis.del(...keys)
      } while (cursor !== '0')
    }
  } catch (_) {
    // best-effort — never throw
  }
}

module.exports = { getWorkersRedis, bustWorkerSessionCache }

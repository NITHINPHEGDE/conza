// conza_admin/admin_backend/config/customersRedis.js
//
// Thin Redis client that connects to the SAME Redis instance used by
// conza_customers/conza_backend.  Used only for cache-busting admin operations
// (e.g. deleting user:session:<id> when a customer is suspended/unsuspended).
//
// Falls back silently — if Redis is unavailable the admin action still succeeds;
// the customer backend's 60-second TTL will expire naturally.

const Redis = require('ioredis')

let client = null

const getCustomersRedis = () => {
  if (client) return client

  const url = process.env.CUSTOMERS_REDIS_URL
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
 * Delete the user session cache for a customer so that the customer backend
 * picks up status changes (e.g. suspended) on the very next request instead
 * of waiting up to 60 s for the cache TTL to expire.
 *
 * @param {string} userId — Mongo ObjectId string
 */
const bustCustomerSessionCache = async (userId) => {
  try {
    const redis = getCustomersRedis()
    if (!redis) return
    await redis.del(`user:session:${userId}`)
  } catch (_) {
    // best-effort — never throw
  }
}

module.exports = { getCustomersRedis, bustCustomerSessionCache }

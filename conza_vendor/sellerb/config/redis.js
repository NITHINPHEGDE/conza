// conzasb/config/redis.js
const Redis = require('ioredis');

let redisClient;

const createClient = () => {
  const client = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  client.on('connect', () => console.log('✅ Redis connected (sellerb)'));
  client.on('reconnecting', () => console.warn('⚠️  Redis reconnecting (sellerb)...'));
  client.on('error', (err) => console.error('❌ Redis error (sellerb, failing-safe):', err.message));

  return client;
};

const getRedis = () => {
  if (!redisClient) redisClient = createClient();
  return redisClient;
};

module.exports = { getRedis };

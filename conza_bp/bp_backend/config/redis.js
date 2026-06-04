// bp_backend/config/redis.js
const Redis = require('ioredis');

let redisClient;
let redisSubscriber;

const createClient = () => {
  const client = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  client.on('connect',      () => console.log('✅ [BP] Redis connected'));
  client.on('reconnecting', () => console.log('🔄 [BP] Redis reconnecting...'));
  client.on('error',        (err) => console.error('⚠️  [BP] Redis error (failing-safe):', err.message));

  return client;
};

const getRedis = () => {
  if (!redisClient) redisClient = createClient();
  return redisClient;
};

// Separate subscriber client required by Socket.io Redis adapter
const getSubscriber = () => {
  if (!redisSubscriber) redisSubscriber = createClient();
  return redisSubscriber;
};

module.exports = { getRedis, getSubscriber };
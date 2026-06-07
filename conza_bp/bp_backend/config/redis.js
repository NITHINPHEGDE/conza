// bp_backend/config/redis.js
const Redis  = require('ioredis');
const logger = require('../utils/logger');

let redisClient;
let redisSubscriber;

const createClient = () => {
  const client = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  client.on('connect',      () => logger.info('[BP] Redis connected'));
  client.on('reconnecting', () => logger.warn('[BP] Redis reconnecting...'));
  client.on('error',        (err) => logger.error({ err }, '[BP] Redis error (failing-safe)'));

  return client;
};

const getRedis = () => {
  if (!redisClient) redisClient = createClient();
  return redisClient;
};

const getSubscriber = () => {
  if (!redisSubscriber) redisSubscriber = createClient();
  return redisSubscriber;
};

module.exports = { getRedis, getSubscriber };
// conza_backend/middleware/rateLimiter.js
const rateLimit    = require('express-rate-limit');
const RedisStore   = require('rate-limit-redis').default;
const { getRedis } = require('../config/redis');

const makeStore = () => {
  try {
    return new RedisStore({
      sendCommand: (...args) => getRedis().call(...args),
    });
  } catch (_) {
    return undefined; // fall back to memory store if Redis unavailable
  }
};

// ── Auth routes: 20 attempts per 15 min per IP ──────────────────────────────
const authLimiter = rateLimit({
  windowMs:  15 * 60 * 1000,
  max:        20,
  message:   { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
  store:      makeStore(),
  skip:       () => process.env.NODE_ENV === 'test',
});

// ── General API: 200 req per minute per IP ───────────────────────────────────
const apiLimiter = rateLimit({
  windowMs:  60 * 1000,
  max:        200,
  message:   { success: false, message: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders:   false,
  store:      makeStore(),
  skip:       () => process.env.NODE_ENV === 'test',
});

module.exports = { authLimiter, apiLimiter };
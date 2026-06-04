// bp_backend/middleware/rateLimiter.js
const rateLimit    = require('express-rate-limit');
const RedisStore   = require('rate-limit-redis').default;
const { getRedis } = require('../config/redis');

const makeStore = () => {
  try {
    return new RedisStore({
      sendCommand: (...args) => getRedis().call(...args),
    });
  } catch (_) {
    return undefined; // graceful fallback to memory store
  }
};

// ── Auth routes: 20 attempts per 15 min per IP ──────────────────────────────
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             20,
  message:         { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
  store:           makeStore(),
  skip:            () => process.env.NODE_ENV === 'test',
});

// ── Worker location pings: 300 req per minute per IP (every ~10 sec is fine) ─
const locationLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             300,
  message:         { success: false, message: 'Too many location updates.' },
  standardHeaders: true,
  legacyHeaders:   false,
  store:           makeStore(),
  skip:            () => process.env.NODE_ENV === 'test',
});

// ── General API: 200 req per minute per IP ───────────────────────────────────
const apiLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             1000, // raised from 200 to 1000 requests per minute
  message:         { success: false, message: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders:   false,
  store:           makeStore(),
  skip:            () => process.env.NODE_ENV === 'test',
});

module.exports = { authLimiter, locationLimiter, apiLimiter };
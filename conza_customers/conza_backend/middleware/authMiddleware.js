const jwt          = require('jsonwebtoken');
const User         = require('../models/User');
const { getRedis } = require('../config/redis');

const USER_CACHE_TTL = 300; // 5 minutes

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized — no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const redis   = getRedis();

    // ── Blacklist check ────────────────────────────────────────────────────
    try {
      const revoked = await redis.get(`blacklist:${token}`);
      if (revoked) {
        return res.status(401).json({ success: false, message: 'Token has been revoked' });
      }
    } catch (_) {}

    // ── Cache-aside: skip DB if user already cached ────────────────────────
    const cacheKey = `user:session:${decoded.id}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        req.user = JSON.parse(cached);
        return next();
      }
    } catch (_) {}

    // ── DB lookup (only on cache miss) ─────────────────────────────────────
    req.user = await User.findById(decoded.id).select('-password').lean();
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Store in Redis for next requests
    try {
      await redis.set(cacheKey, JSON.stringify(req.user), 'EX', USER_CACHE_TTL);
    } catch (_) {}

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

const revokeToken = async (token) => {
  try {
    const decoded    = jwt.decode(token);
    const ttlSeconds = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 86400;
    if (ttlSeconds > 0) {
      const redis = getRedis();
      await redis.set(`blacklist:${token}`, '1', 'EX', ttlSeconds);
      // Also bust the user cache so logout is instant
      if (decoded?.id) await redis.del(`user:session:${decoded.id}`);
    }
  } catch (_) {}
};

module.exports = { protect, revokeToken };
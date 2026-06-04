// conza_backend/middleware/authMiddleware.js
const jwt          = require('jsonwebtoken');
const User         = require('../models/User');
const { getRedis } = require('../config/redis');

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

    // ── Blacklist check (JWT revocation) ───────────────────────────────────
    try {
      const redis     = getRedis();
      const revoked   = await redis.get(`blacklist:${token}`);
      if (revoked) {
        return res.status(401).json({ success: false, message: 'Token has been revoked' });
      }
    } catch (_) {
      // Redis down — allow through (fail-safe)
    }

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

/**
 * Call this helper to revoke a JWT (e.g. on logout or password change).
 * TTL is set to the token's remaining lifetime.
 */
const revokeToken = async (token) => {
  try {
    const decoded    = jwt.decode(token);
    const ttlSeconds = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 86400;
    if (ttlSeconds > 0) {
      await getRedis().set(`blacklist:${token}`, '1', 'EX', ttlSeconds);
    }
  } catch (_) {}
};

module.exports = { protect, revokeToken };
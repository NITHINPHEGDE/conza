// conza_backend/middleware/sellerAuthMiddleware.js
const { verifyToken, decodeToken } = require('../utils/jwt');
const Seller       = require('../models/Seller');
const { getRedis } = require('../config/redis');

const SELLER_CACHE_TTL = 60; // 60-second TTL for seller session cache

const protectSeller = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized — no token' });
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'seller') {
      return res.status(403).json({ success: false, message: 'Access denied — sellers only' });
    }

    const redis = getRedis();

    // ── Blacklist check ──────────────────────────────────────────────────
    try {
      const revoked = await redis.get(`blacklist:${token}`);
      if (revoked) {
        return res.status(401).json({ success: false, message: 'Token has been revoked' });
      }
    } catch (_) {
      // Redis down — allow through (fail-safe)
    }

    // ── Cache-aside: skip DB if seller already cached ──────────────────────
    const cacheKey = `seller:session:${decoded.id}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        req.seller = JSON.parse(cached);
        return next();
      }
    } catch (_) {
      // Redis down — fall back to DB lookup
    }

    // ── DB lookup (only on cache miss) ─────────────────────────────────────
    req.seller = await Seller.findById(decoded.id).select('-password').lean();
    if (!req.seller) {
      return res.status(401).json({ success: false, message: 'Seller not found' });
    }

    // Store in Redis for subsequent requests
    try {
      await redis.set(cacheKey, JSON.stringify(req.seller), 'EX', SELLER_CACHE_TTL);
    } catch (_) {
      // Fail-safe if Redis write fails
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

/**
 * Invalidate seller session cache on updates/status changes.
 */
const invalidateSellerCache = async (sellerId) => {
  try {
    if (!sellerId) return;
    const redis = getRedis();
    await redis.del(`seller:session:${sellerId}`);
  } catch (_) {}
};

/**
 * Revoke seller token and bust session cache.
 */
const revokeSellerToken = async (token) => {
  try {
    const decoded    = decodeToken(token);
    const ttlSeconds = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 86400;
    const redis      = getRedis();
    if (ttlSeconds > 0) {
      await redis.set(`blacklist:${token}`, '1', 'EX', ttlSeconds);
    }
    if (decoded?.id) {
      await redis.del(`seller:session:${decoded.id}`);
    }
  } catch (_) {}
};

module.exports = {
  protectSeller,
  invalidateSellerCache,
  revokeSellerToken,
};
// conza_backend/middleware/sellerAuthMiddleware.js
const jwt          = require('jsonwebtoken');
const Seller       = require('../models/Seller');
const { getRedis } = require('../config/redis');

const protectSeller = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized — no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'seller') {
      return res.status(403).json({ success: false, message: 'Access denied — sellers only' });
    }

    // ── Blacklist check ──────────────────────────────────────────────────
    try {
      const redis   = getRedis();
      const revoked = await redis.get(`blacklist:${token}`);
      if (revoked) {
        return res.status(401).json({ success: false, message: 'Token has been revoked' });
      }
    } catch (_) {
      // Redis down — allow through (fail-safe)
    }

    req.seller = await Seller.findById(decoded.id).select('-password');
    if (!req.seller) {
      return res.status(401).json({ success: false, message: 'Seller not found' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

module.exports = { protectSeller };
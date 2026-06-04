// bp_backend/middleware/auth.js
const jwt          = require('jsonwebtoken');
const Worker       = require('../models/Worker');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getRedis } = require('../config/redis');

const protect = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    throw new AppError('Not authenticated. Please log in.', 401);
  }

  const token = auth.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired token. Please log in again.', 401);
  }

  // ── JWT blacklist check (revocation support) ────────────────────────────
  try {
    const revoked = await getRedis().get(`blacklist:${token}`);
    if (revoked) {
      throw new AppError('Token has been revoked. Please log in again.', 401);
    }
  } catch (redisErr) {
    // If it's our own AppError rethrow it; otherwise Redis is down → fail-safe
    if (redisErr.statusCode) throw redisErr;
  }

  const worker = await Worker.findById(decoded.id).select('-password');
  if (!worker) {
    throw new AppError('Worker no longer exists.', 401);
  }

  req.worker = worker;
  next();
});

/**
 * Revoke a JWT token (call on logout or password change).
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
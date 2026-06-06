const jwt          = require('jsonwebtoken');
const Worker       = require('../models/Worker');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getRedis } = require('../config/redis');

const WORKER_CACHE_TTL = 300; // 5 minutes

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

  const redis = getRedis();

  // ── Blacklist check ──────────────────────────────────────────────────────
  try {
    const revoked = await redis.get(`blacklist:${token}`);
    if (revoked) throw new AppError('Token has been revoked. Please log in again.', 401);
  } catch (redisErr) {
    if (redisErr.statusCode) throw redisErr;
  }

  // ── Cache-aside: skip DB if worker already cached ────────────────────────
  const cacheKey = `worker:session:${decoded.id}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      req.worker = JSON.parse(cached);
      return next();
    }
  } catch (_) {}

  // ── DB lookup (only on cache miss) ──────────────────────────────────────
  const worker = await Worker.findById(decoded.id).select('-password').lean();
  if (!worker) throw new AppError('Worker no longer exists.', 401);

  req.worker = worker;

  try {
    await redis.set(cacheKey, JSON.stringify(worker), 'EX', WORKER_CACHE_TTL);
  } catch (_) {}

  next();
});

const revokeToken = async (token) => {
  try {
    const decoded    = jwt.decode(token);
    const ttlSeconds = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 86400;
    if (ttlSeconds > 0) {
      const redis = getRedis();
      await redis.set(`blacklist:${token}`, '1', 'EX', ttlSeconds);
      if (decoded?.id) await redis.del(`worker:session:${decoded.id}`);
    }
  } catch (_) {}
};

module.exports = { protect, revokeToken };
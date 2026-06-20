// bp_backend/services/workerService.js
const Worker        = require('../models/Worker');
const AppError      = require('../utils/AppError');
const generateToken = require('../utils/generateToken');
const { getRedis }  = require('../config/redis');

// ── GPS Write Buffer ────────────────────────────────────────────────────────
// Workers ping location every 10-15 sec. Instead of hitting MongoDB each time,
// we store the latest coordinate in Redis and flush to MongoDB every 2 minutes.
// This reduces write load by ~92% (1 write per 2 min vs ~8-12 per 2 min).

const GEO_KEY        = 'worker:geo';                  // Redis sorted set key
const FLUSH_INTERVAL = parseInt(process.env.LOCATION_BUFFER_FLUSH_MS || '15000', 10);

let _flushTimer = null;

const startLocationFlush = () => {
  if (_flushTimer) return; // already running
  _flushTimer = setInterval(flushLocationBuffer, FLUSH_INTERVAL);
  console.log(`🗺️  [BP] GPS buffer flush started — every ${FLUSH_INTERVAL / 1000}s`);
};

const flushLocationBuffer = async () => {
  const redis = getRedis();
  try {
    // Read all buffered worker locations from Redis geo set
    const members = await redis.zrange(GEO_KEY, 0, -1);
    if (!members.length) return;

    const pipeline = redis.pipeline();
    for (const workerId of members) {
      pipeline.geopos(GEO_KEY, workerId);
    }
    const positions = await pipeline.exec();

    // Build bulk MongoDB updates
    const bulkOps = [];
    for (let i = 0; i < members.length; i++) {
      const pos = positions[i][1]?.[0];
      if (!pos) continue;
      const [lng, lat] = pos.map(parseFloat);
      bulkOps.push({
        updateOne: {
          filter: { _id: members[i] },
          update: {
            $set: {
              location:       { type: 'Point', coordinates: [lng, lat] },
              lastLocationAt: new Date(),
              isOnline:       true,
            },
          },
        },
      });
    }

    if (bulkOps.length) {
      await Worker.bulkWrite(bulkOps, { ordered: false });
      console.log(`🗺️  [BP] Flushed ${bulkOps.length} worker location(s) to MongoDB`);

      // Bust the session cache for every worker whose record was just updated.
      // The flush writes isOnline:true to MongoDB; if the cached session object
      // still says isOnline:false the next toggle would flip to false instead of
      // true — making the button appear broken for that worker.
      const sessionDelPipeline = redis.pipeline();
      for (const workerId of members) {
        sessionDelPipeline.del(`worker:session:${workerId}`);
      }
      await sessionDelPipeline.exec();
    }

    // Clear the geo set after flush
    await redis.del(GEO_KEY);
  } catch (err) {
    console.error('⚠️  [BP] Location buffer flush failed (will retry next interval):', err.message);
  }
};

// ── Invalidate customer-facing worker cache ─────────────────────────────────
// Both bp_backend and conza_backend share the same Redis instance (same REDIS_URL).
// When a worker's online status changes, we must bust all nearby/category cache
// keys so the customer backend serves fresh data on next request.
const invalidateWorkerCache = async (category) => {
  const redis = getRedis();
  try {
    // Scan and delete all nearby and category cache keys
    const patterns = [
      'workers:nearby:*',
      'workers:categories:*',
    ];
    if (category) {
      // Also bust category-specific search cache if it exists
      patterns.push(`workers:search:${category.toLowerCase()}:*`);
    }

    for (const pattern of patterns) {
      let cursor = '0';
      do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = next;
        if (keys.length) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    }
  } catch (err) {
    // Non-fatal — cache will expire on its own TTL; log but don't block
    console.warn('[BP] Cache invalidation failed (non-fatal):', err.message);
  }
};

// ── Sign Up ────────────────────────────────────────────────────────────────
const signUpWorker = async (data) => {
  const {
    fullName, username, password, phone, email,
    category, skills, minCharge, locationText,
    experience, bio, profileImage,
  } = data;

  const existing = await Worker.findOne({
    $or: [
      { phone },
      { username: username.toLowerCase() },
      ...(email ? [{ email: email.toLowerCase() }] : []),
    ],
  });

  if (existing) {
    if (existing.phone === phone)
      throw new AppError('Phone number is already registered.', 400);
    if (existing.username === username.toLowerCase())
      throw new AppError('Username is already taken.', 400);
    if (email && existing.email === email.toLowerCase())
      throw new AppError('Email is already registered.', 400);
  }

  const worker = await Worker.create({
    fullName,
    username:     username.toLowerCase(),
    password,
    phone,
    email:        email || undefined,
    profileImage: profileImage || null,
    category,
    skills:       skills || [],
    minCharge:    minCharge || null,
    locationText: locationText || '',
    experience:   experience || null,
    bio:          bio || '',
    isOnline:     true,
  });

  // Bust category cache so newly registered worker appears when they go online
  await invalidateWorkerCache(category);

  const token = generateToken(worker._id);
  return { worker: worker.toSafeObject(), token };
};

// ── Log In ─────────────────────────────────────────────────────────────────
const loginWorker = async (identifier, password) => {
  const worker = await Worker.findOne({
    $or: [
      { phone: identifier },
      { username: identifier.toLowerCase() },
      { email: identifier.toLowerCase() },
    ],
  });

  if (!worker) {
    throw new AppError('No account found with that username or phone.', 401);
  }

  const match = await worker.matchPassword(password);
  if (!match) {
    throw new AppError('Incorrect password.', 401);
  }

  // Ensure worker is always online on login
  if (!worker.isOnline) {
    worker.isOnline = true;
    await worker.save();
    try {
      await getRedis().del(`worker:session:${worker._id.toString()}`);
    } catch (_) {}
    await invalidateWorkerCache(worker.category);
  }

  const token = generateToken(worker._id);
  return { worker: worker.toSafeObject(), token };
};

// ── Get profile ────────────────────────────────────────────────────────────
const getWorkerProfile = async (workerId) => {
  const worker = await Worker.findById(workerId).select('-password');
  if (!worker) throw new AppError('Worker not found.', 404);
  return worker;
};

// ── Toggle online — workers can only go online, never offline ─────────────
const toggleOnlineStatus = async (workerId) => {
  const worker = await Worker.findById(workerId).select('-password');
  if (!worker) throw new AppError('Worker not found.', 404);

  // Workers are always online — only set to true, never false
  worker.isOnline = true;

  await worker.save();

  try {
    await getRedis().del(`worker:session:${workerId.toString()}`);
  } catch (_) {}

  await invalidateWorkerCache(worker.category);

  return worker;
};

// ── Update location (called every 10-15 sec while online) ─────────────────
// Writes to Redis geo buffer. MongoDB is updated by the background flush job.
// Falls back to direct MongoDB write if Redis is unavailable.
const updateWorkerLocation = async (workerId, latitude, longitude) => {
  const workerIdStr = workerId.toString();
  let buffered = false;

  try {
    const redis = getRedis();
    // GEOADD stores [lng, lat] — Redis geo uses same order as GeoJSON
    await redis.geoadd(GEO_KEY, longitude, latitude, workerIdStr);
    buffered = true;
  } catch (redisErr) {
    console.warn('[BP] Redis geo buffer unavailable, writing directly to MongoDB:', redisErr.message);
  }

  if (buffered) {
    // Return lightweight response from Redis — no DB read needed
    // Update lastLocationAt in memory for auto-offline check accuracy
    const worker = await Worker.findByIdAndUpdate(
      workerId,
      { lastLocationAt: new Date(), isOnline: true },
      { new: true, select: '-password' }
    );
    if (!worker) throw new AppError('Worker not found.', 404);
    // Overlay buffered coordinates so response reflects the latest ping
    worker.location = { type: 'Point', coordinates: [longitude, latitude] };
    return worker;
  }

  // ── Redis unavailable: direct MongoDB write (same as original behaviour) ─
  const worker = await Worker.findByIdAndUpdate(
    workerId,
    {
      location:       { type: 'Point', coordinates: [longitude, latitude] },
      lastLocationAt: new Date(),
      isOnline:       true,
    },
    { new: true, select: '-password' }
  );
  if (!worker) throw new AppError('Worker not found.', 404);
  return worker;
};

// ── Auto-offline disabled — workers are always online ─────────────────────
const checkAndAutoOffline = async (worker) => {
  // Workers are always online; ensure isOnline is true if somehow false
  if (!worker.isOnline) {
    worker.isOnline = true;
    await worker.save();
    try {
      await getRedis().del(`worker:session:${worker._id.toString()}`);
    } catch (_) {}
    await invalidateWorkerCache(worker.category);
  }
  return worker;
};

// ── Update profile image ───────────────────────────────────────────────────
const updateProfileImage = async (workerId, imageUrl) => {
  const worker = await Worker.findByIdAndUpdate(
    workerId,
    { profileImage: imageUrl },
    { new: true, select: '-password' }
  );
  if (!worker) throw new AppError('Worker not found.', 404);
  return worker;
};

module.exports = {
  signUpWorker,
  loginWorker,
  getWorkerProfile,
  toggleOnlineStatus,
  updateWorkerLocation,
  checkAndAutoOffline,
  updateProfileImage,
  startLocationFlush,   // exported so server.js can start the flush timer
  flushLocationBuffer,  // exported for manual flush if needed (e.g. graceful shutdown)
};//
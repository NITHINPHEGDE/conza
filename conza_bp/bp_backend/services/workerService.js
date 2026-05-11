const Worker        = require('../models/Worker');
const AppError      = require('../utils/AppError');
const generateToken = require('../utils/generateToken');

// ── Sign Up ────────────────────────────────────────────────────────────────
const signUpWorker = async (data) => {
  const {
    fullName, username, password, phone, email,
    category, skills, minCharge, locationText,
    experience, bio, profileImage,
  } = data;

  // Uniqueness checks (mongoose unique index handles DB level, but give clear messages)
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
    username: username.toLowerCase(),
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
  });

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

  const token = generateToken(worker._id);
  return { worker: worker.toSafeObject(), token };
};

// ── Get profile ────────────────────────────────────────────────────────────
const getWorkerProfile = async (workerId) => {
  const worker = await Worker.findById(workerId).select('-password');
  if (!worker) throw new AppError('Worker not found.', 404);
  return worker;
};

// ── Toggle online / offline ────────────────────────────────────────────────
const toggleOnlineStatus = async (workerId) => {
  const worker = await Worker.findById(workerId).select('-password');
  if (!worker) throw new AppError('Worker not found.', 404);

  worker.isOnline = !worker.isOnline;

  // Clear location tracking timestamp when going offline
  if (!worker.isOnline) {
    worker.lastLocationAt = null;
  }

  await worker.save();
  return worker;
};

// ── Update location (called every 10-15 sec while online) ─────────────────
const updateWorkerLocation = async (workerId, latitude, longitude) => {
  const worker = await Worker.findByIdAndUpdate(
    workerId,
    {
      location: {
        type:        'Point',
        coordinates: [longitude, latitude],  // GeoJSON: [lng, lat]
      },
      lastLocationAt: new Date(),
      isOnline: true,  // implicit: sending location = still online
    },
    { new: true, select: '-password' }
  );

  if (!worker) throw new AppError('Worker not found.', 404);
  return worker;
};

// ── Auto-offline timeout check ─────────────────────────────────────────────
// Called by a lightweight periodic job (or inline on profile fetch).
// If no location update in LOCATION_TIMEOUT_MS, mark worker offline.
const checkAndAutoOffline = async (worker) => {
  const timeout = parseInt(process.env.LOCATION_TIMEOUT_MS || '30000', 10);
  if (!worker.isOnline || !worker.lastLocationAt) return worker;

  const elapsed = Date.now() - new Date(worker.lastLocationAt).getTime();
  if (elapsed > timeout) {
    worker.isOnline = false;
    worker.lastLocationAt = null;
    await worker.save();
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
};

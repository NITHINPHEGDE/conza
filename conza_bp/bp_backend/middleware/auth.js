const jwt     = require('jsonwebtoken');
const Worker  = require('../models/Worker');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

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

  const worker = await Worker.findById(decoded.id).select('-password');
  if (!worker) {
    throw new AppError('Worker no longer exists.', 401);
  }

  req.worker = worker;
  next();
});

module.exports = { protect };

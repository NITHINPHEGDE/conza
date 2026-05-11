const AppError = require('../utils/AppError');

// ── Mongoose specific error handlers ──────────────────────────────────────
const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFields = (err) => {
  const field = Object.keys(err.keyPattern)[0];
  const map   = { phone: 'Phone number', username: 'Username', email: 'Email' };
  return new AppError(`${map[field] || field} is already registered.`, 400);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(messages.join('. '), 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your session has expired. Please log in again.', 401);

// ── Main error handler ─────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message };

  if (err.name === 'CastError')           error = handleCastError(err);
  if (err.code === 11000)                 error = handleDuplicateFields(err);
  if (err.name === 'ValidationError')     error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError')   error = handleJWTError();
  if (err.name === 'TokenExpiredError')   error = handleJWTExpiredError();

  const statusCode = error.statusCode || 500;
  const message    = error.message    || 'Something went wrong';

  if (process.env.NODE_ENV === 'development') {
    console.error('💥 Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;

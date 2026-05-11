/**
 * Wraps an async route handler — eliminates try/catch boilerplate.
 * Forwards any thrown error to Express's next() error handler.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;

const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// ── Run validation results ─────────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array()[0].msg;
    throw new AppError(message, 400);
  }
  next();
};

// ── Signup rules ───────────────────────────────────────────────────────────
const signupRules = [
  body('fullName').trim().notEmpty().withMessage('Full name is required.'),
  body('username')
    .trim().notEmpty().withMessage('Username is required.')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters.')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username: only letters, numbers, and underscores.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('phone')
    .trim().notEmpty().withMessage('Phone number is required.')
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number.'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required.'),
  // Existence of the category is checked against the live ServiceCategory
  // collection in workerService.signUpWorker() — the list is admin-managed
  // and changes over time, so it can no longer be a static enum here.
  body('locationText').trim().notEmpty().withMessage('Location is required.'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Invalid email address.'),
  // Pricing (minCharge / baseCharge / perDayCharge) is admin-managed per
  // category and is no longer accepted from the sign-up form — see
  // workerService.signUpWorker(), which derives it from ServiceCategory.
  body('experience').optional({ nullable: true }).isNumeric().withMessage('Experience must be a number.'),
  validate,
];

// ── Login rules ────────────────────────────────────────────────────────────
const loginRules = [
  body('identifier').trim().notEmpty().withMessage('Username or phone is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
  validate,
];

// ── Location update rules ──────────────────────────────────────────────────
const locationRules = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude.'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude.'),
  validate,
];

module.exports = { signupRules, loginRules, locationRules, validate };

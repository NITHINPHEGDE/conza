const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  let exp = process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '30d';
  if (typeof exp !== 'string' || !exp.trim() || exp === 'undefined' || exp === 'null') {
    exp = '30d';
  }
  return jwt.sign({ id }, process.env.JWT_SECRET || 'conza_bp_jwt_secret_fallback_2026', { expiresIn: exp });
};

module.exports = generateToken;

/**
 * config/env.js — Centralized Environment Configuration & Validation (BP Backend)
 *
 * Validates critical environment variables at startup and enforces fail-fast
 * behavior with zero hardcoded fallbacks for JWT secrets.
 */

'use strict';

const dotenv = require('dotenv');
dotenv.config();

const BANNED_SECRETS = new Set([
  'secret',
  '123456',
  'password',
  'conza',
  'jwt_secret',
  'test',
  'development',
  'admin',
  'your_super_secret_jwt_key_here_change_in_production',
  'conza_jwt_secret_fallback_2026',
  'conza_vendor_jwt_secret_fallback_2026',
  'conza_bp_jwt_secret_fallback_2026',
]);

const validateJwtSecret = (secret, varName = 'JWT_SECRET') => {
  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    console.error(`❌ FATAL CONFIG ERROR: ${varName} is required but missing or empty.`);
    process.exit(1);
  }

  const trimmed = secret.trim();

  if (trimmed.length < 16) {
    console.error(`❌ FATAL CONFIG ERROR: ${varName} must be at least 16 characters long for security.`);
    process.exit(1);
  }

  if (BANNED_SECRETS.has(trimmed.toLowerCase())) {
    console.error(`❌ FATAL CONFIG ERROR: ${varName} is using a known insecure/placeholder value.`);
    process.exit(1);
  }

  return trimmed;
};

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = validateJwtSecret(process.env.JWT_SECRET, 'JWT_SECRET');

// Cross-service secret for Customer backend sockets (optional, but if present must be strong)
const customerJwtSecret = process.env.CUSTOMER_JWT_SECRET
  ? validateJwtSecret(process.env.CUSTOMER_JWT_SECRET, 'CUSTOMER_JWT_SECRET')
  : null;

const mongoUri = process.env.MONGO_URI;
if (!mongoUri || !mongoUri.trim()) {
  console.error('❌ FATAL CONFIG ERROR: MONGO_URI is required.');
  process.exit(1);
}

const config = Object.freeze({
  port: parseInt(process.env.PORT, 10) || 5005,
  nodeEnv,
  mongoUri: mongoUri.trim(),
  redisUrl: process.env.REDIS_URL || null,
  jwt: Object.freeze({
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '30d',
    customerSecret: customerJwtSecret,
  }),
  internalSocketSecret: process.env.INTERNAL_SOCKET_SECRET || null,
  customerBackendInternalUrl: process.env.CUSTOMER_BACKEND_INTERNAL_URL || null,
  logLevel: process.env.LOG_LEVEL || (nodeEnv === 'production' ? 'info' : 'debug'),
});

module.exports = config;

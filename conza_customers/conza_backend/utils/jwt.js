/**
 * utils/jwt.js — Centralized JWT Operations
 *
 * All token creation and verification uses the authoritative, validated
 * configuration from config/env.js. Zero hardcoded secrets or fallbacks.
 */

'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Sign an access token using the authoritative JWT secret.
 *
 * @param {object} payload - Claims to include in token
 * @param {object} [options] - Optional overrides (e.g. { expiresIn })
 * @returns {string} Signed JWT
 */
const signToken = (payload, options = {}) => {
  const opts = {
    expiresIn: config.jwt.expiresIn,
    ...options,
  };
  return jwt.sign(payload, config.jwt.secret, opts);
};

/**
 * Verify a token against the authoritative JWT secret, or optionally an allowed alternate secret (e.g. for cross-backend sockets).
 *
 * @param {string} token
 * @param {string} [secretOverride] - Alternate validated secret
 * @returns {object} Decoded token payload
 */
const verifyToken = (token, secretOverride = null) => {
  const secret = secretOverride || config.jwt.secret;
  return jwt.verify(token, secret);
};

/**
 * Safely decode a token without verifying signature (e.g. for reading expiration time on logout).
 *
 * @param {string} token
 * @returns {object|null} Decoded payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  signToken,
  verifyToken,
  decodeToken,
};

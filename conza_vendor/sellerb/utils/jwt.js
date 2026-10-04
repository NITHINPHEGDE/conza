/**
 * utils/jwt.js — Centralized JWT Operations (Vendor Backend)
 *
 * All token creation and verification uses the authoritative, validated
 * configuration from config/env.js. Zero hardcoded secrets or fallbacks.
 */

'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Sign an access token.
 * @param {object} payload
 * @param {object} [options]
 * @returns {string}
 */
const signToken = (payload, options = {}) => {
  const opts = {
    expiresIn: config.jwt.expiresIn,
    ...options,
  };
  return jwt.sign(payload, config.jwt.secret, opts);
};

/**
 * Verify a token against the authoritative JWT secret.
 * @param {string} token
 * @param {string} [secretOverride]
 * @returns {object}
 */
const verifyToken = (token, secretOverride = null) => {
  const secret = secretOverride || config.jwt.secret;
  return jwt.verify(token, secret);
};

/**
 * Safely decode without verification (for reading expiry on logout).
 * @param {string} token
 * @returns {object|null}
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = { signToken, verifyToken, decodeToken };

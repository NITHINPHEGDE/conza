const jwt = require('jsonwebtoken')
const config = require('../config/env')

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  })
}

const generateRefreshToken = (id) => {
  // Must have an explicit refresh secret; fall back to signing with main secret only if no refresh secret configured
  const refreshSecret = config.jwt.refreshSecret || config.jwt.secret;
  return jwt.sign({ id }, refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  })
}

const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret)
}

const setTokenCookie = (res, token) => {
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
  }
  res.cookie('adminToken', token, options)
}

const clearTokenCookie = (res) => {
  res.cookie('adminToken', 'none', {
    expires: new Date(Date.now() + 5000),
    httpOnly: true,
  })
}

module.exports = { generateToken, generateRefreshToken, verifyToken, setTokenCookie, clearTokenCookie }

const jwt = require('jsonwebtoken')

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  })
}

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}

const setTokenCookie = (res, token) => {
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
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

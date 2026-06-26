const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')
const { createError } = require('../utils/error')

const protect = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies && req.cookies.adminToken) {
      token = req.cookies.adminToken
    }

    if (!token) {
      return next(createError(401, 'Access denied. No token provided.'))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const admin = await Admin.findById(decoded.id).select('+permissions')

    if (!admin) {
      return next(createError(401, 'Token is no longer valid. Admin not found.'))
    }

    if (admin.status !== 'active') {
      return next(createError(403, 'Your account has been suspended or deactivated.'))
    }

    req.admin = admin
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(createError(401, 'Invalid token.'))
    }
    if (err.name === 'TokenExpiredError') {
      return next(createError(401, 'Token expired. Please login again.'))
    }
    next(err)
  }
}

const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return next(createError(401, 'Authentication required.'))
    }

    if (req.admin.role === 'super_admin') return next()
    if (req.admin.permissions.includes('all')) return next()

    const hasPermission = permissions.some(p => req.admin.permissions.includes(p))

    if (!hasPermission) {
      return next(createError(403, `Access denied. Required permission: ${permissions.join(' or ')}`))
    }

    next()
  }
}

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return next(createError(401, 'Authentication required.'))
    }

    if (!roles.includes(req.admin.role)) {
      return next(createError(403, 'Access denied. Insufficient role privileges.'))
    }

    next()
  }
}

module.exports = { protect, requirePermission, requireRole }

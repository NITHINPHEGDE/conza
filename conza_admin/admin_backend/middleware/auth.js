const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')
const Role = require('../models/Role')
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

    // Super admin always gets all permissions regardless of role doc
    if (admin.role === 'super_admin') {
      req.admin = admin
      req.effectivePermissions = ['all']
      return next()
    }

    // Resolve effective permissions from the Role document (database-driven RBAC)
    // The Role name in the DB uses display names (e.g. "Operations Manager")
    // but admin.role stores snake_case. We map both.
    const roleNameMap = {
      super_admin: 'Super Admin',
      operations_manager: 'Operations Manager',
      finance_manager: 'Finance Manager',
      support_manager: 'Support Manager',
      content_manager: 'Content Manager',
    }

    const roleName = roleNameMap[admin.role] || admin.role
    const roleDoc = await Role.findOne({ name: roleName, status: 'active' })

    // Effective permissions = role-level permissions (from DB) merged with any
    // individual overrides stored on the admin document itself.
    const rolePermissions = roleDoc ? roleDoc.permissions : []
    const adminPermissions = admin.permissions || []

    // Union: admin-level permissions supplement role-level ones
    const effectivePermissions = Array.from(new Set([...rolePermissions, ...adminPermissions]))

    req.admin = admin
    req.effectivePermissions = effectivePermissions
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

    const effective = req.effectivePermissions || []

    if (effective.includes('all')) return next()

    const hasPermission = permissions.some(p => effective.includes(p))

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
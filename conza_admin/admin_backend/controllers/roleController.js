const Role = require('../models/Role')
const Admin = require('../models/Admin')
const { sendSuccess } = require('../utils/response')
const { createError } = require('../utils/error')

// All supported permission keys and their display metadata
const ALL_PERMISSIONS = [
  { key: 'dashboard',      label: 'Dashboard',          group: 'Main' },
  { key: 'customers',      label: 'Customers',          group: 'Users' },
  { key: 'workers',        label: 'Workers',            group: 'Users' },
  { key: 'vendors',        label: 'Vendors',            group: 'Users' },
  { key: 'bp',             label: 'Business Partners',  group: 'Users' },
  { key: 'bookings',       label: 'Bookings',           group: 'Operations' },
  { key: 'orders',         label: 'Orders',             group: 'Operations' },
  { key: 'maps',           label: 'Live Tracking',      group: 'Operations' },
  { key: 'materials',      label: 'Materials',          group: 'Catalog' },
  { key: 'rentals',        label: 'Rentals',            group: 'Catalog' },
  { key: 'inventory',      label: 'Inventory',          group: 'Catalog' },
  { key: 'services',       label: 'Services',           group: 'Catalog' },
  { key: 'finance',        label: 'Finance',            group: 'Finance' },
  { key: 'wallets',        label: 'Wallets',            group: 'Finance' },
  { key: 'payments',       label: 'Payments',           group: 'Finance' },
  { key: 'pricing',        label: 'Pricing',            group: 'Finance' },
  { key: 'notifications',  label: 'Notifications',      group: 'Engagement' },
  { key: 'complaints',     label: 'Complaints',         group: 'Engagement' },
  { key: 'reviews',        label: 'Reviews',            group: 'Engagement' },
  { key: 'promotions',     label: 'Promotions',         group: 'Engagement' },
  { key: 'content',        label: 'Content',            group: 'Content' },
  { key: 'analytics',      label: 'Analytics',          group: 'Analytics' },
  { key: 'roles',          label: 'Roles & Permissions',group: 'Administration' },
  { key: 'audit',          label: 'Audit Logs',         group: 'Administration' },
]

exports.getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().populate('users').sort({ createdAt: 1 })
    sendSuccess(res, 200, 'Roles fetched', { roles })
  } catch (err) {
    next(err)
  }
}

exports.createRole = async (req, res, next) => {
  try {
    const { name, description, permissions, status } = req.body
    if (!name) return next(createError(400, 'Role name is required.'))

    const exists = await Role.findOne({ name })
    if (exists) return next(createError(409, 'A role with this name already exists.'))

    const role = await Role.create({ name, description, permissions: permissions || [], status })
    req.auditTarget = `Role - ${name}`
    req.auditDetails = `Created new role with permissions: ${(permissions || []).join(', ')}`

    sendSuccess(res, 201, 'Role created successfully', { role })
  } catch (err) {
    next(err)
  }
}

exports.updateRole = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, description, permissions, status } = req.body

    const role = await Role.findById(id)
    if (!role) return next(createError(404, 'Role not found.'))
    if (role.isSystem && req.admin.role !== 'super_admin') {
      return next(createError(403, 'Cannot modify system roles.'))
    }

    const oldName = role.name
    if (name) role.name = name
    if (description !== undefined) role.description = description
    if (permissions) role.permissions = permissions
    if (status) role.status = status

    await role.save()

    req.auditTarget = `Role - ${role.name}`
    req.auditDetails = `Updated role permissions: ${(role.permissions || []).join(', ')}`

    sendSuccess(res, 200, 'Role updated successfully', { role })
  } catch (err) {
    next(err)
  }
}

exports.deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id)
    if (!role) return next(createError(404, 'Role not found.'))
    if (role.isSystem) return next(createError(403, 'Cannot delete system roles.'))

    await role.deleteOne()
    req.auditTarget = `Role - ${role.name}`
    req.auditDetails = 'Deleted role'

    sendSuccess(res, 200, 'Role deleted successfully')
  } catch (err) {
    next(err)
  }
}

exports.toggleRoleStatus = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id)
    if (!role) return next(createError(404, 'Role not found.'))

    role.status = role.status === 'active' ? 'inactive' : 'active'
    await role.save()

    sendSuccess(res, 200, `Role ${role.status === 'active' ? 'activated' : 'deactivated'}`, { role })
  } catch (err) {
    next(err)
  }
}

// Returns the full permission manifest so the frontend can build dynamic UI
exports.getPermissions = async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Permissions fetched', {
      permissions: ALL_PERMISSIONS,
      // backward-compat: keep modules array
      modules: ALL_PERMISSIONS.map(p => p.key),
    })
  } catch (err) {
    next(err)
  }
}

// Returns the effective permissions for a specific role by ID
exports.getRolePermissions = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id)
    if (!role) return next(createError(404, 'Role not found.'))
    sendSuccess(res, 200, 'Role permissions fetched', {
      roleId: role._id,
      roleName: role.name,
      permissions: role.permissions,
    })
  } catch (err) {
    next(err)
  }
}
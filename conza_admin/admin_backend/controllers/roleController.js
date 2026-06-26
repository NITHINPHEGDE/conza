const Role = require('../models/Role')
const { sendSuccess, sendError } = require('../utils/response')
const { createError } = require('../utils/error')

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

    if (name) role.name = name
    if (description !== undefined) role.description = description
    if (permissions) role.permissions = permissions
    if (status) role.status = status

    await role.save()
    req.auditTarget = `Role - ${role.name}`
    req.auditDetails = `Updated role`

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
    req.auditDetails = `Deleted role`

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

exports.getPermissions = async (req, res, next) => {
  try {
    const modules = [
      'dashboard', 'customers', 'workers', 'vendors', 'bp', 'bookings', 'orders',
      'materials', 'rentals', 'inventory', 'finance', 'wallets', 'payments', 'maps',
      'notifications', 'complaints', 'reviews', 'promotions', 'content', 'analytics',
      'roles', 'audit',
    ]
    sendSuccess(res, 200, 'Permissions fetched', { modules })
  } catch (err) {
    next(err)
  }
}
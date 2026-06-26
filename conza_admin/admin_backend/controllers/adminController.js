const Admin = require('../models/Admin')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

exports.getAdmins = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 50, status } = req.query
    const query = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }
    if (status) query.status = status

    const total = await Admin.countDocuments(query)
    const admins = await Admin.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    sendPaginated(res, admins, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role, permissions } = req.body

    if (!name || !email || !password) {
      return next(createError(400, 'Name, email, and password are required.'))
    }

    const existing = await Admin.findOne({ email })
    if (existing) return next(createError(409, 'An admin with this email already exists.'))

    const defaultPermissions = getDefaultPermissions(role)

    const admin = await Admin.create({
      name,
      email,
      password,
      role: role || 'operations_manager',
      permissions: permissions || defaultPermissions,
      status: 'active',
    })

    req.auditTarget = `Admin #${admin._id} - ${admin.name}`
    req.auditDetails = `Created new admin with role: ${admin.role}`

    const adminObj = admin.toObject()
    delete adminObj.password

    sendSuccess(res, 201, 'Admin created successfully', { admin: adminObj })
  } catch (err) {
    next(err)
  }
}

exports.updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, role, permissions, status } = req.body

    const admin = await Admin.findById(id)
    if (!admin) return next(createError(404, 'Admin not found.'))

    // Prevent modifying super admin unless you are super admin
    if (admin.role === 'super_admin' && req.admin.role !== 'super_admin') {
      return next(createError(403, 'Cannot modify a super admin account.'))
    }

    if (name) admin.name = name
    if (role) admin.role = role
    if (permissions) admin.permissions = permissions
    if (status) admin.status = status

    await admin.save()

    req.auditTarget = `Admin #${id} - ${admin.name}`
    req.auditDetails = `Updated admin: role=${admin.role}, status=${admin.status}`

    sendSuccess(res, 200, 'Admin updated successfully', { admin })
  } catch (err) {
    next(err)
  }
}

exports.deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params
    const admin = await Admin.findById(id)

    if (!admin) return next(createError(404, 'Admin not found.'))
    if (admin._id.toString() === req.admin._id.toString()) {
      return next(createError(400, 'You cannot delete your own account.'))
    }
    if (admin.role === 'super_admin') {
      return next(createError(403, 'Cannot delete a super admin account.'))
    }

    await admin.deleteOne()

    req.auditTarget = `Admin #${id} - ${admin.name}`
    req.auditDetails = `Deleted admin account`

    sendSuccess(res, 200, 'Admin deleted successfully')
  } catch (err) {
    next(err)
  }
}

exports.getAdminById = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password')
    if (!admin) return next(createError(404, 'Admin not found.'))
    sendSuccess(res, 200, 'Admin fetched', { admin })
  } catch (err) {
    next(err)
  }
}

function getDefaultPermissions(role) {
  const map = {
    super_admin: ['all'],
    operations_manager: ['customers', 'workers', 'vendors', 'bp', 'bookings', 'orders'],
    finance_manager: ['finance', 'payments', 'wallets', 'payouts'],
    support_manager: ['complaints', 'tickets', 'reviews'],
    content_manager: ['content', 'banners', 'promotions'],
  }
  return map[role] || []
}

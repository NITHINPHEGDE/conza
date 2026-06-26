const AuditLog = require('../models/AuditLog')
const LoginHistory = require('../models/LoginHistory')
const { sendSuccess, sendPaginated } = require('../utils/response')

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { search = '', module, severity, page = 1, limit = 20 } = req.query
    const query = {}
    if (search) query.$or = [{ admin: { $regex: search, $options: 'i' } }, { action: { $regex: search, $options: 'i' } }]
    if (module && module !== 'All') query.module = module
    if (severity && severity !== 'all') query.severity = severity

    const total = await AuditLog.countDocuments(query)
    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, logs, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getLoginHistory = async (req, res, next) => {
  try {
    const { search = '', status, page = 1, limit = 20 } = req.query
    const query = {}
    if (search) query.$or = [{ user: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]
    if (status && status !== 'all') query.status = status

    const total = await LoginHistory.countDocuments(query)
    const history = await LoginHistory.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))

    const formatted = history.map(h => ({
      ...h.toObject(),
      timestamp: h.createdAt,
    }))

    sendPaginated(res, formatted, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getAdminActions = async (req, res, next) => {
  try {
    const { search = '', type, page = 1, limit = 20 } = req.query
    const query = {}
    if (search) query.$or = [{ admin: { $regex: search, $options: 'i' } }, { target: { $regex: search, $options: 'i' } }]
    if (type && type !== 'All') query.type = type

    const total = await AuditLog.countDocuments(query)
    const actions = await AuditLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))

    const formatted = actions.map(a => ({
      ...a.toObject(),
      timestamp: a.createdAt,
    }))

    sendPaginated(res, formatted, total, page, limit)
  } catch (err) {
    next(err)
  }
}

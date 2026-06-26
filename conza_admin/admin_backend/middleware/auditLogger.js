const AuditLog = require('../models/AuditLog')

const logAction = (module, action, type = 'other', severity = 'low') => {
  return async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.admin) {
        try {
          const target = req.auditTarget || `${module} #${req.params.id || 'N/A'}`
          const details = req.auditDetails || ''

          await AuditLog.create({
            adminId: req.admin._id,
            admin: req.admin.name,
            action,
            target,
            details,
            module,
            type,
            severity,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'] || '',
            metadata: req.auditMetadata || {},
          })
        } catch (err) {
          console.error('Audit log error:', err.message)
        }
      }
    })
    next()
  }
}

module.exports = { logAction }

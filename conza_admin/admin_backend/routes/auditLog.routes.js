const express = require('express')
const router = express.Router()
const c = require('../controllers/auditLogController')
const { protect, requirePermission } = require('../middleware/auth')

router.use(protect)
router.use(requirePermission('audit'))

router.get('/', c.getAuditLogs)
router.get('/login-history', c.getLoginHistory)
router.get('/admin-actions', c.getAdminActions)

module.exports = router

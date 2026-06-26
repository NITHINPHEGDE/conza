const express = require('express')
const router = express.Router()
const { getRoles, createRole, updateRole, deleteRole, toggleRoleStatus, getPermissions } = require('../controllers/roleController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('roles'))

router.get('/', getRoles)
router.get('/permissions', getPermissions)
router.post('/', logAction('Roles', 'Role Created', 'role', 'high'), createRole)
router.put('/:id', logAction('Roles', 'Role Updated', 'role', 'high'), updateRole)
router.delete('/:id', logAction('Roles', 'Role Deleted', 'deletion', 'high'), deleteRole)
router.patch('/:id/toggle-status', toggleRoleStatus)

module.exports = router

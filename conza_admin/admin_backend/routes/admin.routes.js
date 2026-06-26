const express = require('express')
const router = express.Router()
const { getAdmins, createAdmin, updateAdmin, deleteAdmin, getAdminById } = require('../controllers/adminController')
const { protect, requireRole } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requireRole('super_admin'))

router.get('/', getAdmins)
router.get('/:id', getAdminById)
router.post('/', logAction('Admins', 'Admin Created', 'creation', 'high'), createAdmin)
router.put('/:id', logAction('Admins', 'Admin Updated', 'update', 'high'), updateAdmin)
router.delete('/:id', logAction('Admins', 'Admin Deleted', 'deletion', 'high'), deleteAdmin)

module.exports = router

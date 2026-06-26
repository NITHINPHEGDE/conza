const express = require('express')
const router = express.Router()
const c = require('../controllers/serviceCategoryController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('content'))

router.get('/', c.getCategories)
router.get('/:id', c.getCategoryById)
router.post('/', logAction('Services', 'Category Created', 'settings', 'medium'), c.createCategory)
router.put('/:id', logAction('Services', 'Category Updated', 'settings', 'medium'), c.updateCategory)
router.delete('/:id', logAction('Services', 'Category Deleted', 'removal', 'medium'), c.deleteCategory)

module.exports = router

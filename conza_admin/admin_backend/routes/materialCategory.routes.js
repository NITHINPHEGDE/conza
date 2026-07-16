const express = require('express')
const router = express.Router()
const c = require('../controllers/materialCategoryController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('materials'))

router.get('/', c.getCategories)
router.get('/:id', c.getCategoryById)
router.post('/', logAction('Materials', 'Category Created', 'settings', 'medium'), c.createCategory)
router.put('/:id', logAction('Materials', 'Category Updated', 'settings', 'medium'), c.updateCategory)
router.delete('/:id', logAction('Materials', 'Category Deleted', 'removal', 'medium'), c.deleteCategory)

module.exports = router

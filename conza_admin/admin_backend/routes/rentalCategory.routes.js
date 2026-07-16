const express = require('express')
const router = express.Router()
const c = require('../controllers/rentalCategoryController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('rentals'))

router.get('/', c.getCategories)
router.get('/:id', c.getCategoryById)
router.post('/', logAction('Rentals', 'Category Created', 'settings', 'medium'), c.createCategory)
router.put('/:id', logAction('Rentals', 'Category Updated', 'settings', 'medium'), c.updateCategory)
router.delete('/:id', logAction('Rentals', 'Category Deleted', 'removal', 'medium'), c.deleteCategory)

module.exports = router

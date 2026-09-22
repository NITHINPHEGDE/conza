const express = require('express')
const router = express.Router()
const c = require('../controllers/catalogueProductController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('materials'))

router.get('/', c.getProducts)
router.post('/upload-image', c.uploadImage)
router.get('/:id', c.getProductById)
router.post('/', logAction('Materials', 'Catalogue Product Created', 'creation', 'low'), c.createProduct)
router.put('/:id', logAction('Materials', 'Catalogue Product Updated', 'update', 'low'), c.updateProduct)
router.delete('/:id', logAction('Materials', 'Catalogue Product Deleted', 'removal', 'medium'), c.deleteProduct)

module.exports = router

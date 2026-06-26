const express = require('express')
const router = express.Router()
const c = require('../controllers/materialController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('materials'))

router.get('/', c.getMaterials)
router.get('/featured', c.getFeaturedMaterials)
router.get('/categories', c.getCategories)
router.get('/low-stock', c.getLowStock)
router.get('/out-of-stock', c.getOutOfStock)
router.get('/:id', c.getMaterialById)
router.put('/:id', c.updateMaterial)
router.put('/:id/feature', c.toggleFeatured)
router.delete('/:id', logAction('Materials', 'Material Deleted', 'removal', 'medium'), c.deleteMaterial)

module.exports = router

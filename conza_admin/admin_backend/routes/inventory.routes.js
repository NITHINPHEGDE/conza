const express = require('express')
const router = express.Router()
const { protect, requirePermission } = require('../middleware/auth')
const { getLowStock, getOutOfStock, getMaterials } = require('../controllers/materialController')
const { sendSuccess } = require('../utils/response')
const Material = require('../models/Material')

router.use(protect)
router.use(requirePermission('inventory'))

router.get('/', async (req, res, next) => {
  try {
    const [total, lowStock, outOfStock, active] = await Promise.all([
      Material.countDocuments(),
      Material.countDocuments({ $expr: { $lte: ['$stock', '$threshold'] } }),
      Material.countDocuments({ $or: [{ stock: 0 }, { status: 'out_of_stock' }] }),
      Material.countDocuments({ status: 'active' }),
    ])
    sendSuccess(res, 200, 'Inventory overview fetched', { overview: { total, lowStock, outOfStock, active } })
  } catch (err) {
    next(err)
  }
})

router.get('/low-stock', getLowStock)
router.get('/out-of-stock', getOutOfStock)
router.get('/analytics', getMaterials)

module.exports = router

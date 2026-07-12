const express = require('express')
const router = express.Router()
const { protect, requirePermission } = require('../middleware/auth')
const { getLowStock, getOutOfStock, getMaterials } = require('../controllers/materialController')
const { sendSuccess } = require('../utils/response')
// Material.js was an orphaned model on the default mongoose connection with
// an empty local collection — real material data lives in the sellersDB
// 'products' collection via the real Product model (type: 'material').
const Product = require('../models/Product')

router.use(protect)
router.use(requirePermission('inventory'))

router.get('/', async (req, res, next) => {
  try {
    const [total, lowStock, outOfStock, active] = await Promise.all([
      Product.countDocuments({ type: 'material' }),
      Product.countDocuments({ type: 'material', $expr: { $lte: ['$stock', '$lowStockAt'] }, stock: { $gt: 0 } }),
      Product.countDocuments({ type: 'material', $or: [{ stock: 0 }, { isAvailable: false }] }),
      Product.countDocuments({ type: 'material', isAvailable: true, stock: { $gt: 0 } }),
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

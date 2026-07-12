const Product = require('../models/Product')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

const deriveStatus = (p) => {
  if (!p.isAvailable) return 'inactive'
  if (p.stock <= 0) return 'out_of_stock'
  return 'active'
}

const mapMaterial = (p) => ({
  id: p._id,
  product: p.title,
  title: p.title,
  vendor: p.seller?.shopName || p.seller?.name || 'Unknown Vendor',
  vendorId: p.seller?._id || p.seller,
  vendorCity: p.seller?.city || '',
  category: p.category,
  price: p.price,
  unit: p.unit,
  stock: p.stock,
  sold: p.sold,
  threshold: p.lowStockAt,
  sku: p.sku,
  hsnCode: p.hsnCode,
  minOrder: p.minOrder,
  weight: p.weight,
  brand: p.brand,
  images: p.images,
  description: p.description,
  isAvailable: p.isAvailable,
  isFeatured: p.isFeatured,
  status: deriveStatus(p),
  createdAt: p.createdAt,
})

exports.getMaterials = async (req, res, next) => {
  try {
    const { search = '', status, category, page = 1, limit = 20 } = req.query
    const query = { type: 'material' }
    if (category && category !== 'all') query.category = category

    const products = await Product.find(query)
      .populate('seller', 'name shopName phone city status')
      .sort({ createdAt: -1 })

    let materials = products.map(mapMaterial)

    if (search) {
      const s = search.toLowerCase()
      materials = materials.filter((m) =>
        m.title?.toLowerCase().includes(s) || m.vendor?.toLowerCase().includes(s) || m.category?.toLowerCase().includes(s)
      )
    }
    if (status && status !== 'all') materials = materials.filter((m) => m.status === status)

    const total = materials.length
    const start = (page - 1) * limit
    const paginated = materials.slice(start, start + Number(limit))

    sendPaginated(res, paginated, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getMaterialById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, type: 'material' }).populate('seller', 'name shopName phone city status')
    if (!product) return next(createError(404, 'Material not found.'))
    sendSuccess(res, 200, 'Material fetched', { material: mapMaterial(product) })
  } catch (err) {
    next(err)
  }
}

exports.updateMaterial = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, type: 'material' })
    if (!product) return next(createError(404, 'Material not found.'))

    const {
      title, description, brand, category, unit, price,
      stock, sku, minOrder, weight, hsnCode, images,
      isAvailable, isFeatured, lowStockAt,
    } = req.body

    if (title !== undefined)       product.title       = title
    if (description !== undefined) product.description = description
    if (brand !== undefined)       product.brand       = brand
    if (category !== undefined)    product.category    = category
    if (unit !== undefined)        product.unit        = unit
    if (price !== undefined)       product.price       = Number(price)
    if (stock !== undefined)       product.stock       = Number(stock)
    if (sku !== undefined)         product.sku         = sku
    if (minOrder !== undefined)    product.minOrder     = Number(minOrder)
    if (weight !== undefined)      product.weight       = weight
    if (hsnCode !== undefined)     product.hsnCode      = hsnCode
    if (Array.isArray(images))     product.images       = images
    if (isAvailable !== undefined) product.isAvailable  = isAvailable
    if (isFeatured !== undefined)  product.isFeatured   = isFeatured
    if (lowStockAt !== undefined)  product.lowStockAt   = Number(lowStockAt)

    await product.save()
    const populated = await product.populate('seller', 'name shopName phone city status')
    req.auditTarget = `Material #${req.params.id} - ${product.title}`
    req.auditDetails = `Material listing updated by admin`
    sendSuccess(res, 200, 'Material updated', { material: mapMaterial(populated) })
  } catch (err) {
    next(err)
  }
}

exports.deleteMaterial = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, type: 'material' })
    if (!product) return next(createError(404, 'Material not found.'))
    req.auditTarget = `Material #${req.params.id} - ${product.title}`
    req.auditDetails = `Material listing removed`
    sendSuccess(res, 200, 'Material deleted')
  } catch (err) {
    next(err)
  }
}

exports.getFeaturedMaterials = async (req, res, next) => {
  try {
    const products = await Product.find({ type: 'material', isFeatured: true })
      .populate('seller', 'name shopName phone city status')
      .sort({ createdAt: -1 })
    sendSuccess(res, 200, 'Featured materials fetched', { materials: products.map(mapMaterial) })
  } catch (err) {
    next(err)
  }
}

exports.toggleFeatured = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, type: 'material' })
    if (!product) return next(createError(404, 'Material not found.'))
    product.isFeatured = !product.isFeatured
    await product.save()
    sendSuccess(res, 200, `Material ${product.isFeatured ? 'featured' : 'unfeatured'}`, { material: mapMaterial(product) })
  } catch (err) {
    next(err)
  }
}

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { type: 'material' })
    sendSuccess(res, 200, 'Material categories fetched', { categories })
  } catch (err) {
    next(err)
  }
}

exports.getLowStock = async (req, res, next) => {
  try {
    const products = await Product.find({ type: 'material', $expr: { $lte: ['$stock', '$lowStockAt'] }, stock: { $gt: 0 } })
      .populate('seller', 'name shopName phone city status')
    sendSuccess(res, 200, 'Low stock materials fetched', { materials: products.map(mapMaterial) })
  } catch (err) {
    next(err)
  }
}

exports.getOutOfStock = async (req, res, next) => {
  try {
    const products = await Product.find({ type: 'material', $or: [{ stock: 0 }, { isAvailable: false }] })
      .populate('seller', 'name shopName phone city status')
    sendSuccess(res, 200, 'Out of stock materials fetched', { materials: products.map(mapMaterial) })
  } catch (err) {
    next(err)
  }
}

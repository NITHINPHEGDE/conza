const Product = require('../models/Product')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

const deriveStatus = (p) => {
  if (!p.isAvailable) return 'inactive'
  if (p.stock <= 0) return 'out_of_stock'
  return 'active'
}

const mapRental = (p) => ({
  id: p._id,
  title: p.title,
  vendor: p.seller?.shopName || p.seller?.name || 'Unknown Vendor',
  vendorId: p.seller?._id || p.seller,
  vendorCity: p.seller?.city || '',
  category: p.category,
  price: p.price,
  deposit: p.deposit,
  minRentalDays: p.minRentalDays,
  stock: p.stock,
  sku: p.sku,
  images: p.images,
  description: p.description,
  isAvailable: p.isAvailable,
  isFeatured: p.isFeatured,
  status: deriveStatus(p),
  createdAt: p.createdAt,
})

exports.getRentals = async (req, res, next) => {
  try {
    const { search = '', status, category, page = 1, limit = 20 } = req.query
    const query = { type: 'rental' }
    if (category && category !== 'all') query.category = category

    const products = await Product.find(query)
      .populate('seller', 'name shopName phone city status')
      .sort({ createdAt: -1 })

    let rentals = products.map(mapRental)

    if (search) {
      const s = search.toLowerCase()
      rentals = rentals.filter((r) =>
        r.title?.toLowerCase().includes(s) || r.vendor?.toLowerCase().includes(s) || r.category?.toLowerCase().includes(s)
      )
    }
    if (status && status !== 'all') rentals = rentals.filter((r) => r.status === status)

    const total = rentals.length
    const start = (page - 1) * limit
    const paginated = rentals.slice(start, start + Number(limit))

    sendPaginated(res, paginated, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getRentalById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, type: 'rental' }).populate('seller', 'name shopName phone city status')
    if (!product) return next(createError(404, 'Rental not found.'))
    sendSuccess(res, 200, 'Rental fetched', { rental: mapRental(product) })
  } catch (err) {
    next(err)
  }
}

exports.updateRental = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, type: 'rental' })
    if (!product) return next(createError(404, 'Rental not found.'))

    const {
      title, description, category, price, deposit, minRentalDays,
      stock, sku, images, isAvailable, isFeatured,
    } = req.body

    if (title !== undefined)         product.title         = title
    if (description !== undefined)   product.description   = description
    if (category !== undefined)      product.category      = category
    if (price !== undefined)         product.price         = Number(price) // price/day
    if (deposit !== undefined)       product.deposit       = Number(deposit)
    if (minRentalDays !== undefined) product.minRentalDays = Number(minRentalDays)
    if (stock !== undefined)         product.stock         = Number(stock)
    if (sku !== undefined)           product.sku           = sku
    if (Array.isArray(images))       product.images        = images
    if (isAvailable !== undefined)   product.isAvailable   = isAvailable
    if (isFeatured !== undefined)    product.isFeatured    = isFeatured

    await product.save()
    const populated = await product.populate('seller', 'name shopName phone city status')
    sendSuccess(res, 200, 'Rental updated', { rental: mapRental(populated) })
  } catch (err) {
    next(err)
  }
}

exports.deleteRental = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, type: 'rental' })
    if (!product) return next(createError(404, 'Rental not found.'))
    sendSuccess(res, 200, 'Rental deleted')
  } catch (err) {
    next(err)
  }
}

exports.getFeaturedRentals = async (req, res, next) => {
  try {
    const products = await Product.find({ type: 'rental', isFeatured: true })
      .populate('seller', 'name shopName phone city status')
      .sort({ createdAt: -1 })
    sendSuccess(res, 200, 'Featured rentals fetched', { rentals: products.map(mapRental) })
  } catch (err) {
    next(err)
  }
}

exports.toggleFeatured = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, type: 'rental' })
    if (!product) return next(createError(404, 'Rental not found.'))
    product.isFeatured = !product.isFeatured
    await product.save()
    sendSuccess(res, 200, `Rental ${product.isFeatured ? 'featured' : 'unfeatured'}`, { rental: mapRental(product) })
  } catch (err) {
    next(err)
  }
}

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { type: 'rental' })
    sendSuccess(res, 200, 'Rental categories fetched', { categories })
  } catch (err) {
    next(err)
  }
}

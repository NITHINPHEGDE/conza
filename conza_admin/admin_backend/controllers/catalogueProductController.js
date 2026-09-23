const CatalogueProduct = require('../models/CatalogueProduct')
const MaterialCategory = require('../models/MaterialCategory')
const Product = require('../models/Product')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../middleware/cloudinaryUpload')

const MAX_IMAGES = 5
const UNITS = CatalogueProduct.UNITS

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const exactCI = (value) => ({ $regex: `^${escapeRegex(value)}$`, $options: 'i' })
const cleanString = (v) => (v === undefined || v === null ? '' : String(v).trim())

const mapProduct = (p, listings = 0) => ({
  id: p._id,
  _id: p._id,
  name: p.name,
  brand: p.brand || '',
  sku: p.sku || '',
  description: p.description || '',
  category: p.category,
  categoryId: p.categoryId || null,
  unit: p.unit || 'piece',
  images: p.images || [],
  isActive: p.isActive !== false,
  listings,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
})

// How many vendor listings currently reference each catalogue product.
const getListingCounts = async (docs) => {
  if (!docs.length) return {}
  const rows = await Product.aggregate([
    { $match: { catalogueProduct: { $in: docs.map((d) => d._id) } } },
    { $group: { _id: '$catalogueProduct', count: { $sum: 1 } } },
  ])
  return rows.reduce((acc, r) => { acc[String(r._id)] = r.count; return acc }, {})
}

const validateText = ({ name, brand, sku, description }) => {
  if (name !== undefined) {
    if (!name) throw createError(400, 'Product name is required.')
    if (name.length > 150) throw createError(400, 'Product name cannot exceed 150 characters.')
  }
  if (brand !== undefined && brand.length > 100) throw createError(400, 'Brand cannot exceed 100 characters.')
  if (sku !== undefined && sku.length > 50) throw createError(400, 'SKU cannot exceed 50 characters.')
  if (description !== undefined && description.length > 2000) throw createError(400, 'Description cannot exceed 2000 characters.')
}

const normalizeImages = (images) => {
  if (!Array.isArray(images)) throw createError(400, 'Images must be an array.')
  const cleaned = [...new Set(
    images.filter((i) => typeof i === 'string' && i.trim()).map((i) => i.trim())
  )]
  if (cleaned.length > MAX_IMAGES) throw createError(400, `You can add up to ${MAX_IMAGES} images.`)
  if (cleaned.some((u) => !/^https:\/\//i.test(u))) {
    throw createError(400, 'Images must be uploaded before saving the product.')
  }
  return cleaned
}

// The category must be one of the admin-managed Material Categories.
const resolveCategory = async (name) => {
  const value = cleanString(name)
  if (!value) throw createError(400, 'Category is required.')
  const category = await MaterialCategory.findOne({ name: exactCI(value) })
  if (!category) {
    throw createError(400, 'Selected category does not exist. Pick one from Material Categories.')
  }
  if (category.active === false) {
    throw createError(400, 'Selected category is inactive. Pick an active category.')
  }
  return category
}

const assertNoDuplicate = async ({ name, brand, sku, excludeId }) => {
  const notSelf = excludeId ? { _id: { $ne: excludeId } } : {}

  if (sku) {
    const skuClash = await CatalogueProduct.findOne({ ...notSelf, sku: exactCI(sku) })
    if (skuClash) throw createError(409, 'A catalogue product with this SKU already exists.')
  }

  const nameClash = await CatalogueProduct.findOne({
    ...notSelf,
    name: exactCI(name),
    brand: exactCI(brand || ''),
  })
  if (nameClash) throw createError(409, 'This product (same name and brand) already exists in the catalogue.')
}

// ── GET /api/catalogue-products ──────────────────────────────────────────────
exports.getProducts = async (req, res, next) => {
  try {
    const search = cleanString(req.query.search)
    const category = cleanString(req.query.category)
    const status = cleanString(req.query.status)
    const pageNum = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limitNum = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100)

    const query = {}
    if (category && category !== 'all') query.category = category
    if (status === 'active') query.isActive = true
    if (status === 'inactive') query.isActive = false
    if (search) {
      const re = new RegExp(escapeRegex(search), 'i')
      query.$or = [{ name: re }, { brand: re }, { sku: re }, { category: re }]
    }

    const [total, docs] = await Promise.all([
      CatalogueProduct.countDocuments(query),
      CatalogueProduct.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
    ])

    const counts = await getListingCounts(docs)
    sendPaginated(res, docs.map((d) => mapProduct(d, counts[String(d._id)] || 0)), total, pageNum, limitNum)
  } catch (err) {
    next(err)
  }
}

// ── GET /api/catalogue-products/:id ──────────────────────────────────────────
exports.getProductById = async (req, res, next) => {
  try {
    const product = await CatalogueProduct.findById(req.params.id)
    if (!product) return next(createError(404, 'Catalogue product not found.'))
    const counts = await getListingCounts([product])
    sendSuccess(res, 200, 'Catalogue product fetched', {
      product: mapProduct(product, counts[String(product._id)] || 0),
    })
  } catch (err) {
    next(err)
  }
}

// ── POST /api/catalogue-products/upload-image ────────────────────────────────
// One image per request (base64 data-URI) so a product with 5 photos never
// blows past the JSON body limit. Returns the Cloudinary URL.
exports.uploadImage = async (req, res, next) => {
  try {
    const { image } = req.body
    if (typeof image !== 'string' || !/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(image)) {
      return next(createError(400, 'A valid image (PNG, JPG, WEBP or GIF) is required.'))
    }
    const url = await uploadToCloudinary(image, 'conza/catalogue-products')
    sendSuccess(res, 200, 'Image uploaded', { url })
  } catch (err) {
    next(err)
  }
}

// ── POST /api/catalogue-products ─────────────────────────────────────────────
// Optional body.linkMaterialId: when the catalogue product is being created
// from a vendor's custom listing ("Add to Catalogue"), link that listing to
// the new catalogue product so it's recognized as catalogue-sourced from now on.
exports.createProduct = async (req, res, next) => {
  try {
    const name = cleanString(req.body.name)
    const brand = cleanString(req.body.brand)
    const sku = cleanString(req.body.sku)
    const description = cleanString(req.body.description)
    const unit = cleanString(req.body.unit) || 'piece'

    validateText({ name, brand, sku, description })
    if (!UNITS.includes(unit)) return next(createError(400, `Unit must be one of: ${UNITS.join(', ')}.`))

    const category = await resolveCategory(req.body.category)
    const images = normalizeImages(req.body.images === undefined ? [] : req.body.images)

    await assertNoDuplicate({ name, brand, sku })

    const product = await CatalogueProduct.create({
      name,
      brand,
      sku,
      description,
      category: category.name,
      categoryId: category._id,
      unit,
      images,
      isActive: req.body.isActive === undefined ? true : Boolean(req.body.isActive),
      createdBy: req.admin?._id || null,
    })

    const linkMaterialId = cleanString(req.body.linkMaterialId)
    if (linkMaterialId) {
      await Product.updateOne(
        { _id: linkMaterialId },
        { $set: { catalogueProduct: product._id } }
      ).catch(() => {})
    }

    req.auditTarget = `Catalogue Product #${product._id} - ${product.name}`
    req.auditDetails = linkMaterialId
      ? 'Added product to the catalogue from a vendor custom listing'
      : 'Added product to the catalogue'
    sendSuccess(res, 201, 'Product added to catalogue', { product: mapProduct(product) })
  } catch (err) {
    next(err)
  }
}

// ── PUT /api/catalogue-products/:id ──────────────────────────────────────────
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await CatalogueProduct.findById(req.params.id)
    if (!product) return next(createError(404, 'Catalogue product not found.'))

    const b = req.body
    const updates = {
      name: b.name !== undefined ? cleanString(b.name) : undefined,
      brand: b.brand !== undefined ? cleanString(b.brand) : undefined,
      sku: b.sku !== undefined ? cleanString(b.sku) : undefined,
      description: b.description !== undefined ? cleanString(b.description) : undefined,
    }
    validateText(updates)

    if (updates.name !== undefined) product.name = updates.name
    if (updates.brand !== undefined) product.brand = updates.brand
    if (updates.sku !== undefined) product.sku = updates.sku
    if (updates.description !== undefined) product.description = updates.description

    if (b.unit !== undefined) {
      const unit = cleanString(b.unit)
      if (!UNITS.includes(unit)) return next(createError(400, `Unit must be one of: ${UNITS.join(', ')}.`))
      product.unit = unit
    }

    // Only re-validate the category when it actually changed, so editing other
    // fields of a product whose category was later deactivated still works.
    if (b.category !== undefined && cleanString(b.category).toLowerCase() !== String(product.category).toLowerCase()) {
      const category = await resolveCategory(b.category)
      product.category = category.name
      product.categoryId = category._id
    }

    let removedImages = []
    if (b.images !== undefined) {
      const images = normalizeImages(b.images)
      removedImages = product.images.filter((u) => !images.includes(u))
      product.images = images
    }

    if (b.isActive !== undefined) product.isActive = Boolean(b.isActive)

    await assertNoDuplicate({
      name: product.name,
      brand: product.brand,
      sku: product.sku,
      excludeId: product._id,
    })

    await product.save()

    // Keep every vendor listing created from this catalogue product in sync
    // so vendors and customers always see the admin's latest details.
    await Product.updateMany(
      { catalogueProduct: product._id },
      {
        $set: {
          title: product.name,
          brand: product.brand,
          sku: product.sku,
          description: product.description,
          category: product.category,
          unit: product.unit,
          images: product.images,
        },
      }
    )

    if (removedImages.length) {
      Promise.allSettled(
        removedImages.map((url) => {
          const publicId = extractPublicId(url)
          return publicId ? deleteFromCloudinary(publicId) : Promise.resolve()
        })
      )
    }

    const counts = await getListingCounts([product])
    req.auditTarget = `Catalogue Product #${product._id} - ${product.name}`
    req.auditDetails = 'Updated catalogue product'
    sendSuccess(res, 200, 'Catalogue product updated', {
      product: mapProduct(product, counts[String(product._id)] || 0),
    })
  } catch (err) {
    next(err)
  }
}

// ── DELETE /api/catalogue-products/:id ───────────────────────────────────────
// Vendor listings created from this product are NOT deleted — they are
// unlinked and keep working as standalone listings.
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await CatalogueProduct.findById(req.params.id)
    if (!product) return next(createError(404, 'Catalogue product not found.'))

    const listings = await Product.countDocuments({ catalogueProduct: product._id })
    if (listings > 0) {
      await Product.updateMany({ catalogueProduct: product._id }, { $set: { catalogueProduct: null } })
    }

    await product.deleteOne()

    // Images are shared with any vendor listings, so only purge them from
    // Cloudinary when nothing else can be using them.
    if (listings === 0 && product.images?.length) {
      Promise.allSettled(
        product.images.map((url) => {
          const publicId = extractPublicId(url)
          return publicId ? deleteFromCloudinary(publicId) : Promise.resolve()
        })
      )
    }

    req.auditTarget = `Catalogue Product #${req.params.id} - ${product.name}`
    req.auditDetails = listings > 0
      ? `Removed from catalogue; ${listings} vendor listing(s) kept and unlinked`
      : 'Removed from catalogue'
    sendSuccess(
      res,
      200,
      listings > 0
        ? `Product deleted. ${listings} vendor listing(s) were kept and unlinked.`
        : 'Product deleted'
    )
  } catch (err) {
    next(err)
  }
}

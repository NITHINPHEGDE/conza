// conzasb/controllers/productController.js
const Product = require('../models/Product');
const Seller  = require('../models/Seller');
const {
  generateUploadSignature,
  deleteFromCloudinary,
  extractPublicId,
} = require('../middleware/cloudinary');
const { invalidateCache } = require('../utils/cacheHelpers');

// ── GET /api/products/upload-signature ───────────────────────────────────────
// Frontend calls this first, then uploads directly to Cloudinary
const getUploadSignature = (req, res) => {
  try {
    const sig = generateUploadSignature('conza/products');
    res.json({ success: true, ...sig });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/products  (seller's own inventory) ───────────────────────────────
const getMyProducts = async (req, res) => {
  try {
    const { type, search, page = 1, limit = 20, available } = req.query;

    const query = { seller: req.seller._id };
    if (type)                query.type        = type;
    if (available !== undefined) query.isAvailable = available === 'true';
    if (search)              query.$text       = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      products,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/products/public  (customer browsing) ────────────────────────────
const getPublicProducts = async (req, res) => {
  try {
    const { type, search, category, page = 1, limit = 20 } = req.query;

    // Only show products from vendors who haven't been suspended
    const activeSellers = await Seller.find({ status: { $ne: 'suspended' } }).select('_id');
    const activeSellerIds = activeSellers.map((s) => s._id);

    const query = { isAvailable: true, stock: { $gt: 0 }, seller: { $in: activeSellerIds } };
    if (type)     query.type     = type;
    if (category) query.category = category;
    if (search)   query.$text    = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('seller', 'name shopName phone city profileImage status isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      products,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/products/public/:id ─────────────────────────────────────────────
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name shopName phone city profileImage address status isVerified');

    if (!product || !product.seller || product.seller.status === 'suspended') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/products ────────────────────────────────────────────────────────
// Images arrive as Cloudinary URLs (uploaded directly from device)
const createProduct = async (req, res) => {
  try {
    const {
      title, description, brand, category, unit, type,
      price, rentalPrice, deposit, minRentalDays,
      stock, sku, minOrder, weight, hsnCode, lowStockAt,
      images,
    } = req.body;

    if (!title || !category || !type || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'title, category, type and price are required',
      });
    }

    const product = await Product.create({
      seller:        req.seller._id,
      title,
      description:   description   || '',
      brand:         brand         || '',
      category,
      unit:          unit          || 'piece',
      type,
      price:         Number(price),
      rentalPrice:   rentalPrice   ? Number(rentalPrice)   : null,
      deposit:       deposit       ? Number(deposit)       : 0,
      minRentalDays: minRentalDays ? Number(minRentalDays) : 1,
      stock:         Number(stock)    || 0,
      sku:           sku           || '',
      minOrder:      Number(minOrder) || 1,
      weight:        weight        || '',
      hsnCode:       hsnCode       || '',
      lowStockAt:    Number(lowStockAt) || 5,
      images:        Array.isArray(images) ? images.slice(0, 5) : [],
    });

    // Bust the customer-facing catalog cache (conza_backend) so the new
    // product appears alongside every existing product immediately —
    // otherwise it stays invisible (or the list stays stale) for up to
    // 60 seconds because that cache lives in a separate service/process.
    await invalidateCache('products:catalog:*');

    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/products/:id ─────────────────────────────────────────────────────
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.seller._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const {
      title, description, brand, category, unit,
      price, rentalPrice, deposit, minRentalDays,
      stock, sku, minOrder, weight, hsnCode,
      isAvailable, lowStockAt,
      images,     // full replacement array of URLs
      addImages,  // append new URLs to existing
    } = req.body;

    // Image replacement logic
    if (Array.isArray(images)) {
      product.images = images.slice(0, 5);
    } else if (Array.isArray(addImages) && addImages.length) {
      product.images = [...product.images, ...addImages].slice(0, 5);
    }

    if (title !== undefined)         product.title         = title;
    if (description !== undefined)   product.description   = description;
    if (brand !== undefined)         product.brand         = brand;
    if (category !== undefined)      product.category      = category;
    if (unit !== undefined)          product.unit          = unit;
    if (price !== undefined)         product.price         = Number(price);
    if (rentalPrice !== undefined)   product.rentalPrice   = Number(rentalPrice);
    if (deposit !== undefined)       product.deposit       = Number(deposit);
    if (minRentalDays !== undefined) product.minRentalDays = Number(minRentalDays);
    if (stock !== undefined)         product.stock         = Number(stock);
    if (sku !== undefined)           product.sku           = sku;
    if (minOrder !== undefined)      product.minOrder      = Number(minOrder);
    if (weight !== undefined)        product.weight        = weight;
    if (hsnCode !== undefined)       product.hsnCode       = hsnCode;
    if (isAvailable !== undefined)   product.isAvailable   = isAvailable;
    if (lowStockAt !== undefined)    product.lowStockAt    = Number(lowStockAt);

    await product.save();
    await invalidateCache(`products:detail:${product._id}`, 'products:catalog:*');
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/products/:id ──────────────────────────────────────────────────
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.seller._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Clean up Cloudinary images
    if (product.images?.length) {
      await Promise.allSettled(
        product.images.map((url) => {
          const publicId = extractPublicId(url);
          return publicId ? deleteFromCloudinary(publicId) : Promise.resolve();
        })
      );
    }

    await product.deleteOne();
    await invalidateCache(`products:detail:${product._id}`, 'products:catalog:*');
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/products/:id/availability ─────────────────────────────────────
const toggleAvailability = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.seller._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    product.isAvailable = !product.isAvailable;
    await product.save();
    await invalidateCache(`products:detail:${product._id}`, 'products:catalog:*');
    res.json({ success: true, isAvailable: product.isAvailable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getUploadSignature,
  getMyProducts,
  getPublicProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleAvailability,
};
const Product = require('../models/Product');
const MaterialCategory = require('../models/MaterialCategory');
const RentalCategory   = require('../models/RentalCategory');
const Seller            = require('../models/Seller');
const { withCache, invalidateCache } = require('../utils/cacheHelpers');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinaryUpload');

// GET /api/seller/products  (seller's own products)
const getMyProducts = async (req, res) => {
  try {
    const { type, search, page = 1, limit = 20, available } = req.query;

    const query = { seller: req.seller._id };
    if (type)   query.type = type;
    if (available !== undefined) query.isAvailable = available === 'true';
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(query),
    ]);

    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products  (public — customer browsing)
const getPublicProducts = async (req, res) => {
  try {
    const { type, search, category, page = 1, limit = 20 } = req.query;
    const cacheKey = `products:catalog:${type||'all'}:${category||'all'}:${page}:${limit}:${search||''}`;
    const TTL      = search ? 0 : 60; // don't cache search results; 60s TTL keeps catalog fresh

    const fetch = async () => {
      const query = { isAvailable: true };
      if (type)     query.type     = type;
      if (category) query.category = category;
      if (search)   query.$text    = { $search: search };
      if (type === 'material') query.stock = { $gt: 0 };

      // Materials and rentals from unverified vendors must never be visible
      // to customers, regardless of type/category/search filters above.
      const verifiedSellerIds = await Seller.find({ isVerified: true }).distinct('_id');
      query.seller = { $in: verifiedSellerIds };

      const skip = (Number(page) - 1) * Number(limit);
      const [products, total] = await Promise.all([
        Product.find(query)
          .populate('seller', 'name shopName phone city profileImage')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Product.countDocuments(query),
      ]);
      return { products, total, page: Number(page), pages: Math.ceil(total / limit) };
    };

    const data = TTL > 0
      ? await withCache(cacheKey, TTL, fetch)
      : await fetch();

    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const cacheKey = `products:detail:${req.params.id}`;
    const TTL      = 360;

    const product = await withCache(cacheKey, TTL, async () => {
      return Product.findById(req.params.id)
        .populate('seller', 'name shopName phone city profileImage address')
        .lean();
    });

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/seller/products
const createProduct = async (req, res) => {
  try {
    const {
      title, description, brand, category, unit, type,
      price, rentalPrice, deposit, minRentalDays,
      stock, sku, minOrder, weight, hsnCode, lowStockAt,
      images, // now just an array of Cloudinary URLs sent from frontend
    } = req.body;

    if (!title || !category || !type || price === undefined) {
      return res.status(400).json({ success: false, message: 'title, category, type, price required' });
    }

    const product = await Product.create({
      seller:       req.seller._id,
      title, description, brand, category,
      unit:         unit         || 'piece',
      type,
      price:        Number(price),
      rentalPrice:  rentalPrice  ? Number(rentalPrice)  : null,
      deposit:      deposit      ? Number(deposit)      : 0,
      minRentalDays: minRentalDays ? Number(minRentalDays) : 1,
      stock:        Number(stock)    || 0,
      sku:          sku          || '',
      minOrder:     Number(minOrder) || 1,
      weight:       weight       || '',
      hsnCode:      hsnCode      || '',
      lowStockAt:   Number(lowStockAt) || 5,
      images:       Array.isArray(images) ? images.slice(0, 5) : [],
    });

    // Bust the public catalog cache so customers immediately see the new
    // product alongside all existing ones (without this, the 60-second
    // cached response keeps serving the pre-creation list and the new
    // product appears to be alone until the old cache expires).
    await invalidateCache('products:catalog:*');

    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/seller/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.seller._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const {
      title, description, brand, category, unit, price, rentalPrice,
      deposit, minRentalDays, stock, sku, minOrder, weight, hsnCode,
      isAvailable, lowStockAt,
      images,      // full replacement array of Cloudinary URLs if provided
      addImages,   // additional URLs to append
    } = req.body;

    if (images !== undefined) {
      product.images = images.slice(0, 5);
    } else if (addImages?.length) {
      product.images = [...(product.images || []), ...addImages].slice(0, 5);
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
    await invalidateCache(
      `products:detail:${product._id}`,
      'products:catalog:*'
    );
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/seller/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.seller._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Delete images from Cloudinary (extract public_id from URL)
    if (product.images?.length) {
      await Promise.allSettled(
        product.images.map((url) => {
          // Cloudinary URL pattern: .../upload/v123456/conza/products/filename.jpg
          const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
          if (match) return deleteFromCloudinary(match[1]);
        })
      );
    }

    await product.deleteOne();
    await invalidateCache(
      `products:detail:${product._id}`,
      'products:catalog:*'
    );
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/seller/products/:id/availability
const toggleAvailability = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.seller._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.isAvailable = !product.isAvailable;
    await product.save();
    await invalidateCache(
      `products:detail:${product._id}`,
      'products:catalog:*'
    );
    res.json({ success: true, isAvailable: product.isAvailable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
const crypto = require('crypto');

// GET /api/seller/products/upload-signature
// Frontend calls this to get a short-lived signed token to upload directly to Cloudinary
const getUploadSignature = (req, res) => {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const folder    = 'conza/products';

  if (!apiSecret || !apiKey || !cloudName) {
    return res.status(500).json({ success: false, message: 'Cloudinary not configured' });
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signature = crypto
    .createHash('sha256')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  res.json({ success: true, signature, timestamp, apiKey, cloudName, folder });
};

// GET /api/products/categories/materials  (public — admin-managed material categories)
const getMaterialCategories = async (req, res) => {
  try {
    const docs = await MaterialCategory.find({ active: true })
      .select('name image')
      .sort({ name: 1 })
      .lean();
    res.json({
      success: true,
      categories: docs.map((c) => ({ id: c._id, name: c.name, image: c.image })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/categories/rentals  (public — admin-managed rental categories)
const getRentalCategories = async (req, res) => {
  try {
    const docs = await RentalCategory.find({ active: true })
      .select('name image')
      .sort({ name: 1 })
      .lean();
    res.json({
      success: true,
      categories: docs.map((c) => ({ id: c._id, name: c.name, image: c.image })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMyProducts, getPublicProducts, getProductById,
  createProduct, updateProduct, deleteProduct, toggleAvailability,getUploadSignature,
  getMaterialCategories, getRentalCategories,
};
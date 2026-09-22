// conzasb/controllers/productController.js
const Product          = require('../models/Product');
const Seller           = require('../models/Seller');
const CatalogueProduct = require('../models/CatalogueProduct');
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

// ── GET /api/catalogue-products/search  (admin catalogue lookup) ─────────────
// Vendor searches the admin-managed catalogue while adding a product. Only
// active products are returned; basic info here always reflects the admin's
// latest edit since it's read straight from the shared collection.
const searchCatalogueProducts = async (req, res) => {
  try {
    const { search = '', category = '', limit = 30 } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    if (search) {
      const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'i');
      query.$or = [{ name: re }, { brand: re }, { sku: re }, { category: re }];
    }

    const products = await CatalogueProduct.find(query)
      .sort({ name: 1 })
      .limit(Math.min(Number(limit) || 30, 50));

    res.json({ success: true, products });
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
    let {
      title, description, brand, category, unit, type,
      price, mrp, rentalPrice, deposit, minRentalDays,
      stock, sku, minOrder, weight, hsnCode, lowStockAt,
      images,
      catalogueProductId,
    } = req.body;

    let catalogueProduct = null;
    if (catalogueProductId) {
      catalogueProduct = await CatalogueProduct.findById(catalogueProductId);
      if (!catalogueProduct || catalogueProduct.isActive === false) {
        return res.status(400).json({ success: false, message: 'Selected catalogue product is not available.' });
      }
      // Basic info, category, unit and photos are admin-owned for a
      // catalogue-linked listing — always take them from the catalogue
      // record itself, never from the request body.
      title       = catalogueProduct.name;
      brand       = catalogueProduct.brand || '';
      description = catalogueProduct.description || '';
      category    = catalogueProduct.category;
      unit        = catalogueProduct.unit || 'piece';
      images      = catalogueProduct.images || [];
    }

    if (!title || !category || !type || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'title, category, type and price are required',
      });
    }

    const product = await Product.create({
      seller:        req.seller._id,
      catalogueProduct: catalogueProduct ? catalogueProduct._id : null,
      title,
      description:   description   || '',
      brand:         brand         || '',
      category,
      unit:          unit          || 'piece',
      type,
      price:         Number(price),
      mrp:           (mrp !== undefined && mrp !== null && mrp !== '') ? Number(mrp) : null,
      rentalPrice:   rentalPrice   ? Number(rentalPrice)   : null,
      deposit:       deposit       ? Number(deposit)       : 0,
      minRentalDays: minRentalDays ? Number(minRentalDays) : 1,
      stock:         Number(stock)    || 0,
      sku:           sku           || '',
      minOrder:      Number(minOrder) || 1,
      weight:        weight        || '',
      hsnCode:       hsnCode       || '',
      lowStockAt:    Number(lowStockAt) || 5,
      images:        catalogueProduct ? images : (Array.isArray(images) ? images.slice(0, 5) : []),
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
      price, mrp, rentalPrice, deposit, minRentalDays,
      stock, sku, minOrder, weight, hsnCode,
      isAvailable, lowStockAt,
      images,     // full replacement array of URLs
      addImages,  // append new URLs to existing
    } = req.body;

    // Basic info, category, unit and photos are admin-owned once a listing is
    // linked to a catalogue product — silently ignore any attempt to edit
    // them here instead of erroring, since the app UI never renders them as
    // editable for a catalogue-linked listing in the first place.
    const isLocked = Boolean(product.catalogueProduct);

    // Image replacement logic
    if (!isLocked) {
      if (Array.isArray(images)) {
        product.images = images.slice(0, 5);
      } else if (Array.isArray(addImages) && addImages.length) {
        product.images = [...product.images, ...addImages].slice(0, 5);
      }
    }

    if (!isLocked && title !== undefined)         product.title         = title;
    if (!isLocked && description !== undefined)   product.description   = description;
    if (!isLocked && brand !== undefined)         product.brand         = brand;
    if (!isLocked && category !== undefined)      product.category      = category;
    if (!isLocked && unit !== undefined)          product.unit          = unit;
    if (price !== undefined)         product.price         = Number(price);
    if (mrp !== undefined)           product.mrp           = (mrp === null || mrp === '') ? null : Number(mrp);
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
  searchCatalogueProducts,
  getMyProducts,
  getPublicProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleAvailability,
};
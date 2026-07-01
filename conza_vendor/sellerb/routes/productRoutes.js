// conzasb/routes/productRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getUploadSignature,
  getMyProducts,
  getPublicProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleAvailability,
} = require('../controllers/productController');
const { protect, requireActive } = require('../middleware/authMiddleware');

// Public — no auth needed (customer browsing)
router.get('/public',     getPublicProducts);
router.get('/public/:id', getProductById);

// Seller protected
router.get('/upload-signature',       protect, requireActive, getUploadSignature);
router.get('/',                       protect, requireActive, getMyProducts);
router.post('/',                      protect, requireActive, createProduct);
router.put('/:id',                    protect, requireActive, updateProduct);
router.delete('/:id',                 protect, requireActive, deleteProduct);
router.patch('/:id/availability',     protect, requireActive, toggleAvailability);

module.exports = router;
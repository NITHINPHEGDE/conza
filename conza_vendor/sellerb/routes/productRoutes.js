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
const { protect } = require('../middleware/authMiddleware');

// Public — no auth needed (customer browsing)
router.get('/public',     getPublicProducts);
router.get('/public/:id', getProductById);

// Seller protected
router.get('/upload-signature',       protect, getUploadSignature);
router.get('/',                       protect, getMyProducts);
router.post('/',                      protect, createProduct);
router.put('/:id',                    protect, updateProduct);
router.delete('/:id',                 protect, deleteProduct);
router.patch('/:id/availability',     protect, toggleAvailability);

module.exports = router;
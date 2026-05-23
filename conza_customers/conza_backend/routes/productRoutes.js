// conzacsb/routes/productRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getMyProducts, createProduct, updateProduct, deleteProduct,
  toggleAvailability, getPublicProducts, getProductById,
  getUploadSignature,
} = require('../controllers/productController');
const { protectSeller } = require('../middleware/sellerAuthMiddleware');

// Public (customer browsing)
router.get('/public',      getPublicProducts);
router.get('/public/:id',  getProductById);

// Seller protected
router.get('/upload-signature', protectSeller, getUploadSignature);  // ← before /:id
router.get('/',            protectSeller, getMyProducts);
router.post('/',           protectSeller, createProduct);
router.put('/:id',         protectSeller, updateProduct);
router.delete('/:id',      protectSeller, deleteProduct);
router.patch('/:id/availability', protectSeller, toggleAvailability);

module.exports = router;
// conzasb/routes/catalogueRoutes.js
const express = require('express');
const router  = express.Router();
const { searchCatalogueProducts } = require('../controllers/productController');
const { protect, requireActive } = require('../middleware/authMiddleware');

// Vendor searches the admin-managed catalogue while adding a product —
// see AddProductScreen's "From Catalogue" tab (sellerf).
router.get('/search', protect, requireActive, searchCatalogueProducts);

module.exports = router;

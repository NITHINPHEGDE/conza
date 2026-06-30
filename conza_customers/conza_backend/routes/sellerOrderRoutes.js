// conzacsb/routes/sellerOrderRoutes.js
const express = require('express');
const router  = express.Router();
const {
  placeOrder, getSellerOrders, getOrderById,
  updateOrderStatus, getDashboard, getMyOrders,
} = require('../controllers/sellerOrderController');
const { protectSeller } = require('../middleware/sellerAuthMiddleware');
const { protect, checkSuspended } = require('../middleware/authMiddleware');

// Customer
router.post('/',       protect, checkSuspended, placeOrder);
router.get('/my',      protect, getMyOrders);

// Seller
router.get('/seller/dashboard', protectSeller, getDashboard);
router.get('/seller/list',      protectSeller, getSellerOrders);
router.get('/seller/:id',       protectSeller, getOrderById);
router.patch('/seller/:id/status', protectSeller, updateOrderStatus);

module.exports = router;
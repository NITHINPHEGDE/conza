// conzasb/routes/orderRoutes.js
const express = require('express');
const router  = express.Router();
const {
  placeOrder, getOrders, getOrderById,
  updateOrderStatus, getOrdersByCustomer,
} = require('../controllers/orderController');
const { protect, requireActive } = require('../middleware/authMiddleware');

// Public — customer places order (auth handled by customer backend JWT separately)
router.post('/', placeOrder);

// Customer — view their own orders (no seller auth, just customerId param)
router.get('/customer/:customerId', getOrdersByCustomer);

// Seller protected
router.get('/',                protect, requireActive, getOrders);
router.get('/:id',             protect, requireActive, getOrderById);
router.patch('/:id/status',    protect, requireActive, updateOrderStatus);

module.exports = router;
const express = require('express')
const router = express.Router()
const c = require('../controllers/rentalController')
const { protect, requirePermission } = require('../middleware/auth')

router.use(protect)
router.use(requirePermission('rentals'))

router.get('/', c.getRentals)
router.get('/featured', c.getFeaturedRentals)
router.get('/categories', c.getCategories)
router.get('/:id', c.getRentalById)
router.put('/:id', c.updateRental)
router.delete('/:id', c.deleteRental)

module.exports = router

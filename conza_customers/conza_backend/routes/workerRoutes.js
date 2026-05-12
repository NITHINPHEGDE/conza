const express = require('express');
const router  = express.Router();
const { getNearbyWorkers, getCategories, searchWorkers } = require('../controllers/workerController');

router.get('/nearby',     getNearbyWorkers);
router.get('/categories', getCategories);
router.get('/search',     searchWorkers);

module.exports = router;
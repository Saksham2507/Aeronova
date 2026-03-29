const express = require('express');
const { getForecast, createForecast, getAllForecasts, updateForecast } = require('../controllers/demandController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getAllForecasts);
router.get('/:region/:sku', protect, getForecast);
router.post('/', protect, createForecast);
router.put('/:id', protect, updateForecast);

module.exports = router;
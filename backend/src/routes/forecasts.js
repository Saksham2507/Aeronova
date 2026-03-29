const express = require('express');
const { getForecasts, storePrediction, getAccuracy } = require('../controllers/forecastController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, getForecasts);
router.post('/', protect, storePrediction);
router.get('/accuracy', protect, getAccuracy);

module.exports = router;
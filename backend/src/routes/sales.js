const express = require('express');
const { getSales, getDailyTrend, getCategoryBreakdown, getMLTrainingData } = require('../controllers/salesController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, getSales);
router.get('/trend', protect, getDailyTrend);
router.get('/categories', protect, getCategoryBreakdown);
router.get('/ml-data', protect, getMLTrainingData);

module.exports = router;
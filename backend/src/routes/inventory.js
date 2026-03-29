const express = require('express');
const { getAll, getByRDC, getSummary, getAnomalies, updateStock } = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, getAll);
router.get('/summary', protect, getSummary);
router.get('/anomalies', protect, getAnomalies);
router.get('/rdc/:rdcCode', protect, getByRDC);
router.put('/stock', protect, updateStock);

module.exports = router;
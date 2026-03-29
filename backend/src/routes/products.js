const express = require('express');
const { getAll, getById, getBySKU, getCategories } = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, getAll);
router.get('/categories', protect, getCategories);
router.get('/sku/:sku', protect, getBySKU);
router.get('/:id', protect, getById);

module.exports = router;
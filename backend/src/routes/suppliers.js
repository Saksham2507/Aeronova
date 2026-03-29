const express = require('express');
const { getAll, getById, getRiskAssessment } = require('../controllers/supplierController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, getAll);
router.get('/risks', protect, getRiskAssessment);
router.get('/:id', protect, getById);

module.exports = router;
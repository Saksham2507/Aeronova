const express = require('express');
const { getAllRDCs, createRDC, getRDCById } = require('../controllers/rdcController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getAllRDCs);
router.post('/', protect, createRDC);
router.get('/:id', protect, getRDCById);

module.exports = router;
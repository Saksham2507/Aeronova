const express = require('express');
const { getAlerts, getActiveCount, createAlert, updateStatus } = require('../controllers/alertController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, getAlerts);
router.get('/count', protect, getActiveCount);
router.post('/', protect, createAlert);
router.patch('/:id/status', protect, updateStatus);

module.exports = router;
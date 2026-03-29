const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./auth');
const demandRoutes = require('./demand');
const inventoryRoutes = require('./inventory');
const rdcRoutes = require('./rdc');

// Mount routes
router.use('/auth', authRoutes);
router.use('/demand', demandRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/rdc', rdcRoutes);

module.exports = router;
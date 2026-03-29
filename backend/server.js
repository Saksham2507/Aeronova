const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./src/config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Database
connectDB();

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/inventory', require('./src/routes/inventory'));
app.use('/api/sales', require('./src/routes/sales'));
app.use('/api/forecasts', require('./src/routes/forecasts'));
app.use('/api/alerts', require('./src/routes/alerts'));
app.use('/api/suppliers', require('./src/routes/suppliers'));
app.use('/api/dashboard', require('./src/routes/dashboard'));

// Intelligence Routes (Stage 3 — AI + ML)
app.use('/api/intelligence', require('./src/routes/intelligence'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Aeronova AI Supply Chain Intelligence',
    version: '2.0.0',
    timestamp: new Date(),
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      inventory: '/api/inventory',
      sales: '/api/sales',
      forecasts: '/api/forecasts',
      alerts: '/api/alerts',
      suppliers: '/api/suppliers',
      dashboard: '/api/dashboard',
      intelligence: '/api/intelligence'
    }
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message });
});

// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Aeronova API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Intelligence: http://localhost:${PORT}/api/intelligence`);
  console.log(`   Env: ${process.env.NODE_ENV || 'development'}\n`);
});
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], required: true },
  category: {
    type: String,
    enum: ['demand_spike', 'demand_drop', 'stockout_risk', 'overstock', 'supplier_risk',
           'weather_event', 'geopolitical', 'commodity_price', 'competitor_move',
           'regulation_change', 'anomaly_detected', 'forecast_deviation'],
    required: true
  },
  source: {
    type: String,
    enum: ['ml_anomaly', 'ml_forecast', 'ml_sentiment', 'claude_ai', 'manual', 'system'],
    required: true
  },
  affectedProducts: [String],
  affectedRDCs: [String],
  affectedSuppliers: [String],
  recommendedActions: [{
    priority: Number,
    action: String,
    deadline: String,
    estimatedSavings: String
  }],
  mlMetadata: {
    modelName: String,
    anomalyScore: Number,
    confidenceScore: Number,
    featureImportance: mongoose.Schema.Types.Mixed
  },
  status: { type: String, enum: ['new', 'acknowledged', 'in_progress', 'resolved', 'dismissed'], default: 'new' },
  resolvedAt: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

alertSchema.index({ severity: 1, status: 1 });
alertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
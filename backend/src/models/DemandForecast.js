const mongoose = require('mongoose');

const demandForecastSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, index: true },
    region: { type: String, required: true },
    week: { type: Number, required: true },
    year: { type: Number, required: true },
    p10: { type: Number, required: true },
    p50: { type: Number, required: true },
    p90: { type: Number, required: true },
    confidence: { type: Number, min: 0, max: 100, default: 70 },
    actualDemand: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

demandForecastSchema.index({ sku: 1, region: 1, week: 1, year: 1 });

module.exports = mongoose.model('DemandForecast', demandForecastSchema);
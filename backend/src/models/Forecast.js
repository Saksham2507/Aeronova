const mongoose = require('mongoose');

const forecastSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  rdcCode: { type: String, required: true },
  category: String,
  forecastDate: { type: Date, required: true },
  targetWeek: { type: Date, required: true },
  predictions: {
    p10: Number,
    p50: Number,
    p90: Number
  },
  modelUsed: { type: String, enum: ['lstm', 'prophet', 'ensemble', 'manual'], default: 'lstm' },
  confidence: { type: Number, min: 0, max: 1 },
  inputFeatures: {
    historicalSales: [Number],
    temperature: [Number],
    festivalEffect: Number,
    promoEffect: Number,
    trendComponent: Number,
    seasonalComponent: Number
  },
  colorPrediction: {
    white: Number,
    silver: Number,
    black: Number,
    stainless_steel: Number,
    rose_gold: Number
  },
  actual: Number,
  error: Number,
  mape: Number
}, { timestamps: true });

forecastSchema.index({ sku: 1, rdcCode: 1, targetWeek: 1 });

module.exports = mongoose.model('Forecast', forecastSchema);
const mongoose = require('mongoose');

const commodityPriceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  commodity: {
    type: String,
    enum: ['copper', 'aluminum', 'steel', 'polyethylene', 'crude_oil', 'natural_gas',
           'semiconductor_index', 'refrigerant_r32', 'refrigerant_r290'],
    required: true
  },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  priceINR: Number,
  changePercent: Number,
  movingAvg7d: Number,
  movingAvg30d: Number,
  volatility30d: Number,
  supplyChainImpact: {
    affectedComponents: [String],
    costImpactPerUnit: Number,
    affectedCategories: [String]
  }
}, { timestamps: true });

commodityPriceSchema.index({ date: 1, commodity: 1 }, { unique: true });

module.exports = mongoose.model('CommodityPrice', commodityPriceSchema);
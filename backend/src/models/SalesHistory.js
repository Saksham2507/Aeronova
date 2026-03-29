const mongoose = require('mongoose');

const salesHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  sku: { type: String, required: true },
  rdcCode: { type: String, required: true },
  category: String,
  unitsSold: { type: Number, required: true },
  revenue: Number,
  channel: { type: String, enum: ['retail', 'online_flipkart', 'online_amazon', 'distributor', 'direct'] },
  region: String,
  externalFactors: {
    temperature: Number,
    humidity: Number,
    rainfall: Number,
    festival: String,
    promoActive: Boolean,
    promoDiscount: Number,
    competitorPriceIndex: Number
  },
  colorBreakdown: {
    white: Number,
    silver: Number,
    black: Number,
    stainless_steel: Number,
    rose_gold: Number
  }
}, { timestamps: true });

salesHistorySchema.index({ date: 1, sku: 1, rdcCode: 1 });
salesHistorySchema.index({ date: 1 });
salesHistorySchema.index({ category: 1, date: 1 });

module.exports = mongoose.model('SalesHistory', salesHistorySchema);
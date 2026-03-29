const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  sku: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  rdcCode: { type: String, required: true },
  currentStock: { type: Number, default: 0 },
  safetyStock: Number,
  reorderPoint: Number,
  maxCapacity: Number,
  status: {
    type: String,
    enum: ['critical', 'warning', 'normal', 'overstock'],
    default: 'normal'
  },
  daysOfSupply: Number,
  lastRestocked: Date,
  avgDailySales: Number,
  pendingInbound: Number,
  pendingOutbound: Number,
  anomalyFlag: { type: Boolean, default: false },
  anomalyScore: Number
}, { timestamps: true });

inventorySchema.index({ sku: 1, rdcCode: 1 }, { unique: true });

inventorySchema.methods.calculateStatus = function () {
  if (this.currentStock <= 0) return 'critical';
  if (this.daysOfSupply < 7) return 'critical';
  if (this.daysOfSupply < 14) return 'warning';
  if (this.currentStock > this.maxCapacity * 0.9) return 'overstock';
  return 'normal';
};

module.exports = mongoose.model('Inventory', inventorySchema);
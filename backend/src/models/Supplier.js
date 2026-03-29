const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  country: String,
  region: { type: String, enum: ['taiwan', 'south_korea', 'china', 'india'] },
  components: [{
    name: String,
    category: String,
    unitCost: Number,
    currency: { type: String, default: 'INR' }
  }],
  performance: {
    leadTimeDays: Number,
    reliabilityScore: { type: Number, min: 0, max: 100 },
    qualityScore: { type: Number, min: 0, max: 100 },
    defectRate: Number
  },
  capacity: {
    monthlyUnits: Number,
    currentUtilization: Number,
    surgeCapacity: Number
  },
  risks: {
    geopoliticalRisk: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    singleSourceRisk: Boolean,
    alternateSuppliers: [String]
  },
  sustainability: {
    carbonFootprint: Number,
    esgScore: Number,
    certifications: [String]
  },
  status: { type: String, enum: ['active', 'at_risk', 'suspended'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
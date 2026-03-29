const mongoose = require('mongoose');

const rdcSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  state: String,
  region: { type: String, enum: ['north', 'south', 'east', 'west', 'central'] },
  coordinates: { lat: Number, lng: Number },
  capacity: {
    totalUnits: Number,
    currentUtilization: Number
  },
  demandClass: {
    tier: { type: String, enum: ['tier1_metro', 'tier2_city', 'tier3_town'] },
    avgDailyDemand: Number,
    responseTimeTarget: String
  },
  cluster: {
    clusterId: Number,
    clusterLabel: String
  },
  connectedPlants: [String],
  transferPartners: [{
    rdcCode: String,
    transferTimeDays: Number,
    transportCost: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('RDC', rdcSchema);
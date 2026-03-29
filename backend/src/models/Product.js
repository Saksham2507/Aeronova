const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['refrigerator', 'air_conditioner', 'washing_machine', 'water_heater', 'microwave'],
    required: true
  },
  variant: {
    color: { type: String, enum: ['white', 'silver', 'black', 'stainless_steel', 'rose_gold'] },
    size: String,
    starRating: { type: Number, min: 1, max: 5 }
  },
  pricing: {
    costPrice: Number,
    sellingPrice: Number,
    margin: Number
  },
  components: [{
    name: String,
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    costPerUnit: Number,
    leadTimeDays: Number,
    origin: { type: String, enum: ['taiwan', 'south_korea', 'china', 'domestic'] }
  }],
  seasonality: {
    peakMonths: [Number],
    lowMonths: [Number],
    weatherSensitive: Boolean,
    festivalSensitive: Boolean
  },
  status: { type: String, enum: ['active', 'discontinued', 'planned'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
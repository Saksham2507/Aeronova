const Inventory = require('../models/Inventory');

exports.getAll = async (req, res) => {
  try {
    const { rdcCode, status, category } = req.query;
    const filter = {};
    if (rdcCode) filter.rdcCode = rdcCode;
    if (status) filter.status = status;
    const inventory = await Inventory.find(filter).populate('productId', 'name category variant');
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getByRDC = async (req, res) => {
  try {
    const inventory = await Inventory.find({ rdcCode: req.params.rdcCode })
      .populate('productId', 'name category variant');
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const summary = await Inventory.aggregate([
      {
        $group: {
          _id: '$rdcCode',
          totalStock: { $sum: '$currentStock' },
          avgDaysOfSupply: { $avg: '$daysOfSupply' },
          criticalCount: { $sum: { $cond: [{ $eq: ['$status', 'critical'] }, 1, 0] } },
          warningCount: { $sum: { $cond: [{ $eq: ['$status', 'warning'] }, 1, 0] } },
          normalCount: { $sum: { $cond: [{ $eq: ['$status', 'normal'] }, 1, 0] } },
          overstockCount: { $sum: { $cond: [{ $eq: ['$status', 'overstock'] }, 1, 0] } },
          anomalyCount: { $sum: { $cond: ['$anomalyFlag', 1, 0] } }
        }
      },
      { $sort: { criticalCount: -1 } }
    ]);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAnomalies = async (req, res) => {
  try {
    const anomalies = await Inventory.find({ anomalyFlag: true })
      .populate('productId', 'name category')
      .sort({ anomalyScore: -1 });
    res.json(anomalies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { sku, rdcCode, currentStock } = req.body;
    const inventory = await Inventory.findOneAndUpdate(
      { sku, rdcCode },
      { currentStock, updatedAt: new Date() },
      { new: true }
    );
    if (!inventory) return res.status(404).json({ error: 'Inventory record not found' });
    inventory.status = inventory.calculateStatus();
    await inventory.save();
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
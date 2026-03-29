const Supplier = require('../models/Supplier');

exports.getAll = async (req, res) => {
  try {
    const { region, status } = req.query;
    const filter = {};
    if (region) filter.region = region;
    if (status) filter.status = status;
    const suppliers = await Supplier.find(filter).sort({ 'performance.reliabilityScore': -1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRiskAssessment = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ 'risks.geopoliticalRisk': { $in: ['high', 'critical'] } });
    const singleSource = await Supplier.find({ 'risks.singleSourceRisk': true });
    res.json({ highRiskSuppliers: suppliers, singleSourceRisks: singleSource });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
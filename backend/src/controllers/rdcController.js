const RDC = require('../models/RDC');

exports.getAllRDCs = async (req, res) => {
  try {
    const rdcs = await RDC.find();
    res.json(rdcs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createRDC = async (req, res) => {
  try {
    const rdc = new RDC(req.body);
    await rdc.save();
    res.status(201).json(rdc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRDCById = async (req, res) => {
  try {
    const { id } = req.params;
    const rdc = await RDC.findById(id);
    res.json(rdc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};  
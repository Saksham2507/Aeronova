const Product = require('../models/Product');

exports.getAll = async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    const products = await Product.find(filter).populate('components.supplierId', 'name country');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('components.supplierId');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBySKU = async (req, res) => {
  try {
    const product = await Product.findOne({ sku: req.params.sku });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$pricing.sellingPrice' } } },
      { $sort: { count: -1 } }
    ]);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
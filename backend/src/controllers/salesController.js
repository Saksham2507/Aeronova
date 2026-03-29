const SalesHistory = require('../models/SalesHistory');

exports.getSales = async (req, res) => {
  try {
    const { sku, rdcCode, startDate, endDate, category } = req.query;
    const filter = {};
    if (sku) filter.sku = sku;
    if (rdcCode) filter.rdcCode = rdcCode;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    const sales = await SalesHistory.find(filter).sort({ date: -1 }).limit(500);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDailyTrend = async (req, res) => {
  try {
    const { sku, rdcCode, days = 90 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const match = { date: { $gte: startDate } };
    if (sku) match.sku = sku;
    if (rdcCode) match.rdcCode = rdcCode;

    const trend = await SalesHistory.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalUnits: { $sum: '$unitsSold' },
          totalRevenue: { $sum: '$revenue' },
          avgTemperature: { $avg: '$externalFactors.temperature' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(trend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCategoryBreakdown = async (req, res) => {
  try {
    const breakdown = await SalesHistory.aggregate([
      {
        $group: {
          _id: '$category',
          totalUnits: { $sum: '$unitsSold' },
          totalRevenue: { $sum: '$revenue' },
          avgDailyUnits: { $avg: '$unitsSold' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    res.json(breakdown);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMLTrainingData = async (req, res) => {
  try {
    const { sku, rdcCode, months = 12 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const match = { date: { $gte: startDate } };
    if (sku) match.sku = sku;
    if (rdcCode) match.rdcCode = rdcCode;

    const data = await SalesHistory.find(match)
      .select('date sku rdcCode unitsSold category externalFactors colorBreakdown')
      .sort({ date: 1 })
      .lean();
    res.json({ count: data.length, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
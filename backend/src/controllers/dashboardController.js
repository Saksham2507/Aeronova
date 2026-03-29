const Inventory = require('../models/Inventory');
const SalesHistory = require('../models/SalesHistory');
const Alert = require('../models/Alert');
const Forecast = require('../models/Forecast');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

exports.getOverview = async (req, res) => {
  try {
    const [
      totalProducts,
      activeAlerts,
      inventorySummary,
      recentSales,
      supplierRisks
    ] = await Promise.all([
      Product.countDocuments({ status: 'active' }),
      Alert.countDocuments({ status: { $in: ['new', 'acknowledged'] } }),
      Inventory.aggregate([
        {
          $group: {
            _id: null,
            totalStock: { $sum: '$currentStock' },
            avgDaysOfSupply: { $avg: '$daysOfSupply' },
            criticalItems: { $sum: { $cond: [{ $eq: ['$status', 'critical'] }, 1, 0] } },
            anomalies: { $sum: { $cond: ['$anomalyFlag', 1, 0] } }
          }
        }
      ]),
      SalesHistory.aggregate([
        { $sort: { date: -1 } },
        { $limit: 7 },
        { $group: { _id: null, totalUnits: { $sum: '$unitsSold' }, totalRevenue: { $sum: '$revenue' } } }
      ]),
      Supplier.countDocuments({ 'risks.geopoliticalRisk': { $in: ['high', 'critical'] } })
    ]);

    res.json({
      products: { active: totalProducts },
      alerts: { active: activeAlerts },
      inventory: inventorySummary[0] || { totalStock: 0, avgDaysOfSupply: 0, criticalItems: 0, anomalies: 0 },
      sales: recentSales[0] || { totalUnits: 0, totalRevenue: 0 },
      suppliers: { atRisk: supplierRisks }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
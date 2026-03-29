const Forecast = require('../models/Forecast');

exports.getForecasts = async (req, res) => {
  try {
    const { sku, rdcCode, upcoming } = req.query;
    const filter = {};
    if (sku) filter.sku = sku;
    if (rdcCode) filter.rdcCode = rdcCode;
    if (upcoming === 'true') filter.targetWeek = { $gte: new Date() };
    const forecasts = await Forecast.find(filter).sort({ targetWeek: 1 }).limit(100);
    res.json(forecasts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.storePrediction = async (req, res) => {
  try {
    const forecast = await Forecast.create(req.body);
    res.status(201).json(forecast);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAccuracy = async (req, res) => {
  try {
    const accuracy = await Forecast.aggregate([
      { $match: { actual: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$modelUsed',
          avgMAPE: { $avg: '$mape' },
          avgConfidence: { $avg: '$confidence' },
          totalPredictions: { $sum: 1 }
        }
      }
    ]);
    res.json(accuracy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
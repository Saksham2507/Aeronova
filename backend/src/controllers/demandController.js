const DemandForecast = require('../models/DemandForecast');

exports.getForecast = async (req, res) => {
  try {
    const { region, sku } = req.params;
    const forecast = await DemandForecast.findOne({ region, sku });
    res.json(forecast || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createForecast = async (req, res) => {
  try {
    const forecast = new DemandForecast(req.body);
    await forecast.save();
    res.status(201).json(forecast);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllForecasts = async (req, res) => {
  try {
    const forecasts = await DemandForecast.find().limit(100);
    res.json(forecasts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateForecast = async (req, res) => {
  try {
    const { id } = req.params;
    const forecast = await DemandForecast.findByIdAndUpdate(id, req.body, { new: true });
    res.json(forecast);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
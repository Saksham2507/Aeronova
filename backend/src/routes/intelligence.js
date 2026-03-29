const express = require('express');
const { protect } = require('../middleware/auth');
const { analyzeCascade } = require('../services/cascadeMapper');
const { analyzeNewsForSupplyChain } = require('../services/newsIntelligence');
const { predictWeatherImpact } = require('../services/weatherPredictor');
const { runSimulation } = require('../services/digitalTwin');
const { generateSmartAlerts } = require('../services/smartAlerts');
const { checkMLHealth, getDemandPrediction, getRDCClusters, getTrainingSummary } = require('../services/mlBridge');

const router = express.Router();

router.get('/ml/health', protect, async (req, res) => {
  try { res.json(await checkMLHealth()); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/ml/summary', protect, async (req, res) => {
  try { res.json(await getTrainingSummary()); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/ml/demand', protect, async (req, res) => {
  try { res.json(await getDemandPrediction()); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/ml/clusters', protect, async (req, res) => {
  try { res.json(await getRDCClusters()); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/cascade', protect, async (req, res) => {
  try {
    const { event } = req.body;
    if (!event) return res.status(400).json({ error: 'Provide an event description' });
    res.json({ status: 'success', analysis: await analyzeCascade(event) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/news', protect, async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'Provide a news topic' });
    res.json({ status: 'success', ...(await analyzeNewsForSupplyChain(topic)) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/weather', protect, async (req, res) => {
  try {
    const { city } = req.body;
    if (!city) return res.status(400).json({ error: 'Provide a city name' });
    res.json({ status: 'success', ...(await predictWeatherImpact(city)) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/simulate', protect, async (req, res) => {
  try {
    const { scenario } = req.body;
    if (!scenario) return res.status(400).json({ error: 'Provide a scenario' });
    res.json({ status: 'success', simulation: await runSimulation(scenario) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/alerts/generate', protect, async (req, res) => {
  try { res.json({ status: 'success', ...(await generateSmartAlerts()) }); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
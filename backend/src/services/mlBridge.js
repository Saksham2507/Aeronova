/**
 * ML Bridge Service
 * ==================
 * Connects Express backend to the Python Flask ML API (port 5001).
 * Fetches predictions from all 5 models and formats them for the AI layer.
 */

const axios = require('axios');

const ML_API_BASE = process.env.ML_API_URL || 'http://localhost:5001/api/ml';

// ─── HEALTH CHECK ───
async function checkMLHealth() {
  try {
    const res = await axios.get(`${ML_API_BASE}/health`, { timeout: 5000 });
    return res.data;
  } catch (error) {
    return { status: 'offline', error: error.message };
  }
}

// ─── DEMAND PREDICTION (LSTM) ───
async function getDemandPrediction() {
  try {
    const res = await axios.post(`${ML_API_BASE}/predict/demand`, {}, { timeout: 30000 });
    return res.data;
  } catch (error) {
    console.error('ML demand prediction error:', error.message);
    return { status: 'error', error: error.message };
  }
}

// ─── ANOMALY DETECTION ───
async function detectAnomalies(inventoryData) {
  try {
    const res = await axios.post(`${ML_API_BASE}/detect/anomalies`,
      { inventory: inventoryData },
      { timeout: 15000 }
    );
    return res.data;
  } catch (error) {
    console.error('ML anomaly detection error:', error.message);
    return { status: 'error', error: error.message };
  }
}

// ─── SENTIMENT CLASSIFICATION ───
async function classifySentiment(headlines) {
  try {
    const res = await axios.post(`${ML_API_BASE}/classify/sentiment`,
      { headlines },
      { timeout: 15000 }
    );
    return res.data;
  } catch (error) {
    console.error('ML sentiment classification error:', error.message);
    return { status: 'error', error: error.message };
  }
}

// ─── PRICE PREDICTION ───
async function predictPrice(commodity) {
  try {
    const res = await axios.post(`${ML_API_BASE}/predict/price`,
      { commodity },
      { timeout: 15000 }
    );
    return res.data;
  } catch (error) {
    console.error('ML price prediction error:', error.message);
    return { status: 'error', error: error.message };
  }
}

// ─── RDC CLUSTERS ───
async function getRDCClusters() {
  try {
    const res = await axios.get(`${ML_API_BASE}/clusters`, { timeout: 10000 });
    return res.data;
  } catch (error) {
    console.error('ML cluster fetch error:', error.message);
    return { status: 'error', error: error.message };
  }
}

// ─── TRAINING SUMMARY ───
async function getTrainingSummary() {
  try {
    const res = await axios.get(`${ML_API_BASE}/summary`, { timeout: 10000 });
    return res.data;
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

// ─── GET ALL ML INSIGHTS AT ONCE ───
async function getAllMLInsights(inventoryData, headlines) {
  const [demand, anomalies, sentiment, copperPrice, oilPrice, clusters] = await Promise.allSettled([
    getDemandPrediction(),
    inventoryData ? detectAnomalies(inventoryData) : Promise.resolve(null),
    headlines ? classifySentiment(headlines) : Promise.resolve(null),
    predictPrice('copper'),
    predictPrice('crude_oil'),
    getRDCClusters()
  ]);

  return {
    demand: demand.status === 'fulfilled' ? demand.value : null,
    anomalies: anomalies.status === 'fulfilled' ? anomalies.value : null,
    sentiment: sentiment.status === 'fulfilled' ? sentiment.value : null,
    copperPrice: copperPrice.status === 'fulfilled' ? copperPrice.value : null,
    oilPrice: oilPrice.status === 'fulfilled' ? oilPrice.value : null,
    clusters: clusters.status === 'fulfilled' ? clusters.value : null
  };
}

module.exports = {
  checkMLHealth,
  getDemandPrediction,
  detectAnomalies,
  classifySentiment,
  predictPrice,
  getRDCClusters,
  getTrainingSummary,
  getAllMLInsights
};
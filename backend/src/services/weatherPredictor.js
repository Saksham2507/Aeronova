const { callAIWithSearch, callAIJSON, AERONOVA_CONTEXT } = require('./claudeAI');
const { getDemandPrediction } = require('./mlBridge');

async function fetchWeather(city) {
  const raw = await callAIWithSearch(
    'Return ONLY JSON, no markdown: {"city":"","current_temp_c":0,"condition":"","humidity":0,"forecast":[{"day":"Mon","high":0,"low":0,"condition":""}],"alerts":[]}',
    `Current weather and 7-day forecast for ${city}, India`,
    { maxTokens: 600 }
  );
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (e) {}
  return null;
}

async function predictWeatherImpact(city) {
  const weather = await fetchWeather(city);
  if (!weather) return { weather: null, prediction: null };

  let mlDemand = null;
  try { mlDemand = await getDemandPrediction(); } catch (e) {}

  const prediction = await callAIJSON(
    `${AERONOVA_CONTEXT}

You are the Weather-Demand Predictor. Return ONLY JSON:
{
  "city": "",
  "demand_predictions": [
    {"product": "Air Conditioners", "change_percent": 0, "reasoning": ""},
    {"product": "Refrigerators", "change_percent": 0, "reasoning": ""},
    {"product": "Water Heaters", "change_percent": 0, "reasoning": ""},
    {"product": "Washing Machines", "change_percent": 0, "reasoning": ""}
  ],
  "color_shift": {"trending_up": [], "trending_down": [], "reason": ""},
  "postponement_cell_action": "",
  "rdc_rebalancing": "",
  "revenue_opportunity": "",
  "risk_alerts": []
}`,
    `Weather in ${city}: ${JSON.stringify(weather)}. LSTM demand prediction: ${mlDemand ? JSON.stringify(mlDemand.predictions?.slice(0, 3)) : 'unavailable'}`,
    { maxTokens: 1000 }
  );

  return { weather, ml_demand: mlDemand, ai_prediction: prediction };
}

module.exports = { fetchWeather, predictWeatherImpact };
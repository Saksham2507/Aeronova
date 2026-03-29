const { callAIJSONWithSearch, AERONOVA_CONTEXT } = require('./claudeAI');
const { detectAnomalies } = require('./mlBridge');
const Alert = require('../models/Alert');
const Inventory = require('../models/Inventory');

async function generateSmartAlerts() {
  let anomalyAlerts = [];
  try {
    const inventory = await Inventory.find({}).lean();
    if (inventory.length > 0) {
      const anomalyResult = await detectAnomalies(inventory);
      if (anomalyResult?.anomalies) {
        anomalyAlerts = anomalyResult.anomalies.map(a => ({
          title: `Inventory anomaly: ${a.sku} at ${a.rdcCode}`,
          description: `Stock: ${a.currentStock}, Days of Supply: ${a.daysOfSupply}, Score: ${a.anomaly_score?.toFixed(3)}`,
          severity: a.anomaly_score < -0.3 ? 'high' : 'medium',
          category: 'anomaly_detected',
          source: 'ml_anomaly',
          affectedProducts: [a.sku],
          affectedRDCs: [a.rdcCode],
          mlMetadata: { modelName: 'isolation_forest', anomalyScore: a.anomaly_score }
        }));
      }
    }
  } catch (e) {
    console.error('ML anomaly detection failed:', e.message);
  }

  const aiAlerts = await callAIJSONWithSearch(
    `${AERONOVA_CONTEXT}

Search for current global events affecting Indian appliance supply chains. Return ONLY JSON:
{
  "alerts": [
    {
      "severity": "critical|high|medium|low",
      "category": "geopolitical|weather_event|commodity_price|regulation_change|competitor_move|logistics|demand_spike",
      "title": "Short title",
      "description": "What happened",
      "supply_chain_impact": "Impact on Aeronova",
      "recommended_action": "What to do",
      "time_sensitivity": "IMMEDIATE|THIS_WEEK|THIS_MONTH",
      "affected_products": [],
      "potential_savings": ""
    }
  ]
}
Generate 5 alerts based on REAL current events.`,
    `Generate supply chain alerts for today ${new Date().toLocaleDateString()}.`,
    { maxTokens: 1200 }
  );

  const allAlerts = [];
  for (const alert of anomalyAlerts.slice(0, 5)) {
    try { allAlerts.push(await Alert.create(alert)); } catch (e) {}
  }
  if (aiAlerts?.alerts) {
    for (const alert of aiAlerts.alerts) {
      try {
        allAlerts.push(await Alert.create({
          title: alert.title, description: alert.description, severity: alert.severity,
          category: alert.category, source: 'claude_ai',
          affectedProducts: alert.affected_products || [],
          recommendedActions: [{ priority: 1, action: alert.recommended_action, deadline: alert.time_sensitivity, estimatedSavings: alert.potential_savings }]
        }));
      } catch (e) {}
    }
  }

  return { total_alerts: allAlerts.length, ml_anomaly_alerts: anomalyAlerts.length, ai_event_alerts: aiAlerts?.alerts?.length || 0, alerts: allAlerts };
}

module.exports = { generateSmartAlerts };
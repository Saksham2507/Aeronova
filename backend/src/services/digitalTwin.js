const { callAIJSON, AERONOVA_CONTEXT } = require('./claudeAI');
const { getDemandPrediction, getRDCClusters } = require('./mlBridge');

async function runSimulation(scenarioDescription) {
  let mlContext = '';
  try {
    const [demand, clusters] = await Promise.allSettled([getDemandPrediction(), getRDCClusters()]);
    if (demand.status === 'fulfilled' && demand.value?.predictions) {
      mlContext += `LSTM 7-day forecast: ${JSON.stringify(demand.value.predictions)}\n`;
    }
    if (clusters.status === 'fulfilled' && clusters.value?.assignments) {
      mlContext += `RDC clusters: ${JSON.stringify(clusters.value.cluster_names)}\n`;
    }
  } catch (e) {}

  const result = await callAIJSON(
    `${AERONOVA_CONTEXT}

You are the Digital Twin Simulation Engine. ML outputs: ${mlContext}

Network: Coimbatore 2000 units/day, Pune 1500 units/day + postponement cells.
RDC stock: Delhi 1800, Mumbai 2200, Bangalore 800, Hyderabad 600, Kolkata 400, Chennai 500, Pune 2000 neutral, Noida 700.
Suppliers: Taiwan 56-day lead, S.Korea 49-day, China 42-day, India 14-day.

Return ONLY JSON:
{
  "scenario_name": "",
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "duration_days": 0,
  "timeline": [{"day": 1, "event": "", "plant_status": "", "inventory_impact": "", "customer_impact": ""}],
  "stockout_risk": {"day_of_first_stockout": 0, "affected_rdcs": [], "affected_products": []},
  "total_financial_impact": "",
  "mitigation_plan": [{"day": 0, "action": "", "cost": "", "benefit": ""}],
  "with_vs_without": {
    "without_ai": {"detection_time": "", "revenue_lost": "", "extra_cost": "", "market_share_impact": ""},
    "with_aeronova_ai": {"detection_time": "", "revenue_saved": "", "cost_avoided": "", "actions_taken": []}
  },
  "postponement_cell_response": "",
  "lessons_learned": []
}`,
    scenarioDescription,
    { maxTokens: 1500 }
  );

  return result;
}

module.exports = { runSimulation };
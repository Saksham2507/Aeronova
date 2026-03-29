const { callAIJSONWithSearch, AERONOVA_CONTEXT } = require('./claudeAI');
const { predictPrice, classifySentiment } = require('./mlBridge');
const Alert = require('../models/Alert');

async function analyzeCascade(eventDescription) {
  let priceContext = '';
  try {
    const [copper, oil] = await Promise.allSettled([predictPrice('copper'), predictPrice('crude_oil')]);
    if (copper.status === 'fulfilled' && copper.value?.prediction) {
      const p = copper.value.prediction;
      priceContext += `ML Copper Price: Current $${p.current_price}, Predicted $${p.predicted_price} (${p.change_percent > 0 ? '+' : ''}${p.change_percent.toFixed(1)}%)\n`;
    }
    if (oil.status === 'fulfilled' && oil.value?.prediction) {
      const p = oil.value.prediction;
      priceContext += `ML Oil Price: Current $${p.current_price}, Predicted $${p.predicted_price} (${p.change_percent > 0 ? '+' : ''}${p.change_percent.toFixed(1)}%)\n`;
    }
  } catch (e) {}

  let sentimentContext = '';
  try {
    const sentiment = await classifySentiment([eventDescription]);
    if (sentiment?.results?.[0]) {
      const s = sentiment.results[0];
      sentimentContext = `ML Sentiment: ${s.sentiment} (confidence: ${(s.confidence * 100).toFixed(0)}%)`;
    }
  } catch (e) {}

  const systemPrompt = `${AERONOVA_CONTEXT}

You are the Geopolitical Cascade Mapper. Trace a global event through EVERY level of cause-and-effect until it reaches specific Aeronova products.

ML Model outputs: ${priceContext} ${sentimentContext}

Return ONLY a JSON object with these fields:
event, severity (LOW|MEDIUM|HIGH|CRITICAL), confidence (0-1),
cascade_chain (array of {level, cause, effect, magnitude, timeline, confidence}),
affected_skus (array of {sku_pattern, product, cost_impact_per_unit, margin_impact, action}),
affected_suppliers (array of {supplier, risk, alternative}),
affected_rdcs (array of strings),
recommended_actions (array of {priority, action, deadline, cost, savings_if_acted, risk_if_ignored}),
demand_shift ({products_up: [{product, change, reason}], products_down: [{product, change, reason}]}),
postponement_cell_action (string),
competitor_impact (string),
total_financial_impact (string),
opportunity_score (0-100), risk_score (0-100)`;

  const result = await callAIJSONWithSearch(systemPrompt, eventDescription, { maxTokens: 1500 });

  if (result && (result.severity === 'HIGH' || result.severity === 'CRITICAL')) {
    try {
      await Alert.create({
        title: result.event || eventDescription.substring(0, 100),
        description: eventDescription,
        severity: result.severity.toLowerCase(),
        category: 'geopolitical',
        source: 'claude_ai',
        affectedProducts: result.affected_skus?.map(s => s.product) || [],
        affectedRDCs: result.affected_rdcs || [],
        recommendedActions: result.recommended_actions?.map((a, i) => ({
          priority: a.priority || i + 1, action: a.action, deadline: a.deadline, estimatedSavings: a.savings_if_acted
        })) || [],
        mlMetadata: { modelName: 'cascade_mapper', confidenceScore: result.confidence }
      });
    } catch (e) {}
  }

  return result;
}

module.exports = { analyzeCascade };
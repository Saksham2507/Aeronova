const { callAIWithSearch, callAIJSON, AERONOVA_CONTEXT } = require('./claudeAI');
const { classifySentiment } = require('./mlBridge');

async function searchNews(topic) {
  const raw = await callAIWithSearch(
    'You search for latest news. Return ONLY a JSON array of 6 news items. Each item: {"title": "", "source": "", "date": "", "summary": "1 sentence"}. No markdown, no backticks, just the JSON array.',
    `Search for the latest news about: "${topic}"`,
    { maxTokens: 800 }
  );
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch (e) {}
  return [];
}

async function analyzeNewsForSupplyChain(topic) {
  const news = await searchNews(topic);
  if (!news.length) return { news: [], analysis: null };

  const headlines = news.map(n => n.title);
  let sentimentResults = null;
  try {
    sentimentResults = await classifySentiment(headlines);
  } catch (e) {
    console.error('ML sentiment failed:', e.message);
  }

  const enrichedNews = news.map((n, i) => ({
    ...n,
    ml_sentiment: sentimentResults?.results?.[i]?.sentiment || 'unknown',
    ml_confidence: sentimentResults?.results?.[i]?.confidence || 0
  }));

  const newsSummary = enrichedNews.map(n =>
    `- "${n.title}" (ML Sentiment: ${n.ml_sentiment}, Confidence: ${(n.ml_confidence * 100).toFixed(0)}%): ${n.summary}`
  ).join('\n');

  const analysis = await callAIJSON(
    `${AERONOVA_CONTEXT}

Analyze news headlines scored by ML sentiment classifier. Return ONLY JSON:
{
  "overall_risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "overall_sentiment": "POSITIVE|NEGATIVE|MIXED|NEUTRAL",
  "key_insights": ["insight1", "insight2", "insight3"],
  "supply_risks": [{"risk": "", "probability": "HIGH|MEDIUM|LOW", "mitigation": "", "affected_products": []}],
  "demand_impact": {"direction": "UP|DOWN|MIXED|STABLE", "magnitude_percent": 0, "affected_categories": [], "reasoning": ""},
  "opportunities": [],
  "immediate_actions": [{"action": "", "deadline": "", "savings": ""}],
  "competitor_implications": ""
}`,
    `Analyze these news stories for supply chain impact:\n\n${newsSummary}`,
    { maxTokens: 1200 }
  );

  return {
    news: enrichedNews,
    analysis,
    ml_summary: {
      total_headlines: headlines.length,
      negative_count: enrichedNews.filter(n => n.ml_sentiment === 'negative').length,
      positive_count: enrichedNews.filter(n => n.ml_sentiment === 'positive').length,
      neutral_count: enrichedNews.filter(n => n.ml_sentiment === 'neutral').length
    }
  };
}

module.exports = { searchNews, analyzeNewsForSupplyChain };
import { useState } from 'react';
import api from '../services/api';

const presetTopics = [
  "India heat wave summer 2026", "Iran Israel war oil prices", "semiconductor chip shortage",
  "India monsoon forecast", "Flipkart Amazon appliance sale", "copper aluminum commodity prices",
  "India BIS regulation appliances", "China Taiwan trade tensions"
];

export default function NewsIntelligence() {
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!topic.trim()) return;
    setLoading(true); setResult(null);
    try {
      const { data } = await api.post('/intelligence/news', { topic });
      setResult(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>News Intelligence Engine</h1>
        <p>Real-time news → ML sentiment filter → AI deep analysis</p>
      </div>

      <div className="card">
        <div className="input-row">
          <input className="ai-input-inline" placeholder="Search topic..." value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} />
          <button className="btn-primary" onClick={search} disabled={loading}>{loading ? '⏳ Searching...' : '🔍 Search & Analyze'}</button>
        </div>
        <div className="preset-grid">
          {presetTopics.map((t, i) => <button key={i} className="preset-btn" onClick={() => setTopic(t)}>{t}</button>)}
        </div>
      </div>

      {loading && <div className="loading-box"><div className="spinner" /><p>Searching web → ML scoring headlines → AI analyzing impact...</p></div>}

      {result?.news?.length > 0 && (
        <div className="card">
          <h3>News ({result.news.length} articles)</h3>
          {result.ml_summary && (
            <div className="badge-row" style={{ marginBottom: 16 }}>
              <span className="badge-outline">Negative: {result.ml_summary.negative_count}</span>
              <span className="badge-outline">Positive: {result.ml_summary.positive_count}</span>
              <span className="badge-outline">Neutral: {result.ml_summary.neutral_count}</span>
            </div>
          )}
          {result.news.map((n, i) => (
            <div key={i} className="news-card">
              <div className="news-title">{n.title}</div>
              <div className="news-meta">
                <span>{n.source}</span> · <span>{n.date}</span>
                <span className={'ml-badge ml-' + n.ml_sentiment}>{n.ml_sentiment} ({Math.round(n.ml_confidence * 100)}%)</span>
              </div>
              <div className="news-summary">{n.summary}</div>
            </div>
          ))}
        </div>
      )}

      {result?.analysis && (
        <div className="card" style={{ borderLeft: '4px solid #6366f1' }}>
          <h3>AI Supply Chain Analysis</h3>
          <div className="badge-row">
            <span className="badge" style={{ background: result.analysis.overall_risk_level === 'HIGH' ? '#ef4444' : '#f59e0b', color: '#fff' }}>{result.analysis.overall_risk_level}</span>
            <span className="badge-outline">Sentiment: {result.analysis.overall_sentiment}</span>
          </div>
          {result.analysis.key_insights?.map((ins, i) => <div key={i} className="insight-row">● {ins}</div>)}
          {result.analysis.supply_risks?.map((r, i) => (
            <div key={i} className="risk-row">
              <strong>{r.risk}</strong>
              <span className="badge-sm">{r.probability}</span>
              <div className="text-muted">→ {r.mitigation}</div>
            </div>
          ))}
          {result.analysis.opportunities?.map((o, i) => <div key={i} className="opportunity-row">✦ {o}</div>)}
        </div>
      )}
    </div>
  );
}
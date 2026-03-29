import { useState } from 'react';
import api from '../services/api';

const presets = [
  "Iran-Israel war escalation causing oil prices to spike 40%. How does this affect our appliance supply chain?",
  "Massive heat wave predicted across North India next week, temperatures 47°C",
  "Taiwan semiconductor shortage worsening, lead times doubled to 16 weeks",
  "Flipkart Big Billion Days announced for next month with 40% appliance discounts",
  "India announces 25% import duty on Chinese electronic components",
  "Severe monsoon flooding blocks Mumbai-Pune highway for 10 days",
];

export default function CascadeMapper() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const { data } = await api.post('/intelligence/cascade', { event: query });
      setResult(data.analysis);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed');
    }
    setLoading(false);
  };

  const sevColor = (s) => ({ CRITICAL: '#dc2626', HIGH: '#ea580c', MEDIUM: '#d97706', LOW: '#16a34a' }[s] || '#888');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Geopolitical Cascade Mapper</h1>
        <p>Trace any global event through N levels of cause-and-effect to your specific SKUs</p>
      </div>

      <div className="card">
        <textarea className="ai-input" rows={3} placeholder="Describe a global event... e.g. 'Iran-Israel war causing oil shortage — what happens to our fridge costs?'" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyze(); } }} />
        <button className="btn-primary" onClick={analyze} disabled={loading} style={{ marginTop: 12 }}>
          {loading ? '⏳ AI is analyzing cascade effects...' : '🧠 Analyze Cascade'}
        </button>
        <div className="preset-label">Try these scenarios:</div>
        <div className="preset-grid">
          {presets.map((p, i) => (
            <button key={i} className="preset-btn" onClick={() => setQuery(p)}>{p.slice(0, 65)}...</button>
          ))}
        </div>
      </div>

      {loading && <div className="loading-box"><div className="spinner" /><p>Gemini AI is tracing the cascade: event → commodities → components → SKUs → ₹ impact...</p></div>}
      {error && <div className="card error-card">{error}</div>}

      {result && (
        <div className="card" style={{ borderLeft: `4px solid ${sevColor(result.severity)}` }}>
          <div className="result-header">
            <div>
              <h2 className="result-title">{result.event}</h2>
              <div className="badge-row">
                <span className="badge" style={{ background: sevColor(result.severity), color: '#fff' }}>{result.severity}</span>
                <span className="badge-outline">Confidence: {Math.round((result.confidence || 0) * 100)}%</span>
                <span className="badge-outline">Risk: {result.risk_score}/100</span>
                <span className="badge-outline">Opportunity: {result.opportunity_score}/100</span>
              </div>
            </div>
          </div>

          {/* Cascade Chain */}
          {result.cascade_chain && (
            <div className="section">
              <h3>Cascade Chain</h3>
              <div className="cascade-chain">
                {result.cascade_chain.map((c, i) => (
                  <div key={i} className="cascade-step">
                    <div className="cascade-level">L{c.level}</div>
                    <div className="cascade-body">
                      <div className="cascade-cause">{c.cause}</div>
                      <div className="cascade-arrow">→</div>
                      <div className="cascade-effect">{c.effect}</div>
                      <div className="cascade-meta">
                        <span className="badge-sm">{c.magnitude}</span>
                        <span className="cascade-timeline">{c.timeline}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affected SKUs */}
          {result.affected_skus && (
            <div className="section">
              <h3>Affected Products</h3>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Product</th><th>Cost Impact</th><th>Margin</th><th>Action</th></tr></thead>
                  <tbody>
                    {result.affected_skus.map((s, i) => (
                      <tr key={i}>
                        <td><strong>{s.product}</strong><br /><span className="text-muted">{s.sku_pattern}</span></td>
                        <td>{s.cost_impact_per_unit}</td>
                        <td className="text-red">{s.margin_impact}</td>
                        <td>{s.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {result.recommended_actions && (
            <div className="section">
              <h3>Recommended Actions</h3>
              {result.recommended_actions.map((a, i) => (
                <div key={i} className="action-row">
                  <div className="action-priority">P{a.priority}</div>
                  <div className="action-body">
                    <div className="action-text">{a.action}</div>
                    <div className="action-meta">
                      <span>⏰ {a.deadline}</span>
                      {a.savings_if_acted && <span>💰 Save: {a.savings_if_acted}</span>}
                      {a.cost && <span>💳 Cost: {a.cost}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Demand Shift */}
          {result.demand_shift && (
            <div className="section">
              <h3>Demand Shift Prediction</h3>
              <div className="grid-2">
                {result.demand_shift.products_up?.length > 0 && (
                  <div className="shift-box shift-up">
                    <h4>📈 Demand UP</h4>
                    {result.demand_shift.products_up.map((p, i) => (
                      <div key={i} className="shift-item"><strong>{p.product}</strong> {p.change}<br/><span className="text-muted">{p.reason}</span></div>
                    ))}
                  </div>
                )}
                {result.demand_shift.products_down?.length > 0 && (
                  <div className="shift-box shift-down">
                    <h4>📉 Demand DOWN</h4>
                    {result.demand_shift.products_down.map((p, i) => (
                      <div key={i} className="shift-item"><strong>{p.product}</strong> {p.change}<br/><span className="text-muted">{p.reason}</span></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Postponement + Competitor */}
          {result.postponement_cell_action && (
            <div className="highlight-box purple">{`🏭 Postponement Cell: ${result.postponement_cell_action}`}</div>
          )}
          {result.competitor_impact && (
            <div className="highlight-box green">{`🏆 Competitor Impact: ${result.competitor_impact}`}</div>
          )}
          {result.total_financial_impact && (
            <div className="highlight-box amber">{`💰 Total Financial Impact: ${result.total_financial_impact}`}</div>
          )}
        </div>
      )}
    </div>
  );
}
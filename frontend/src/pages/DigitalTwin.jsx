import { useState } from 'react';
import api from '../services/api';

const presets = [
  { label: 'Supplier Down 30 Days', scenario: 'Main compressor supplier in Taiwan goes offline for 30 days due to earthquake.' },
  { label: '42% Demand Spike', scenario: 'Unexpected heat wave causes 42% demand surge for ACs and refrigerators in North India for 3 weeks.' },
  { label: 'Pune Plant Shutdown', scenario: 'Pune final assembly plant goes down for 15 days due to machinery breakdown.' },
  { label: 'Port Strike 10 Days', scenario: 'Mumbai port workers strike for 10 days. All container imports blocked.' },
  { label: 'Flash Sale 3x Demand', scenario: 'Flipkart announces surprise 40% off on all appliances starting in 3 days.' },
];

export default function DigitalTwin() {
  const [scenario, setScenario] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const simulate = async () => {
    if (!scenario.trim()) return;
    setLoading(true); setResult(null);
    try {
      const { data } = await api.post('/intelligence/simulate', { scenario });
      setResult(data.simulation);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Digital Twin Simulator</h1>
        <p>Simulate disruptions on a virtual copy of your supply chain — before they happen</p>
      </div>

      <div className="card">
        <div className="preset-grid">
          {presets.map((p, i) => <button key={i} className="preset-btn" onClick={() => setScenario(p.scenario)}>{p.label}</button>)}
        </div>
        <textarea className="ai-input" rows={3} placeholder="Describe a disruption scenario..." value={scenario} onChange={e => setScenario(e.target.value)} />
        <button className="btn-primary" onClick={simulate} disabled={loading} style={{ marginTop: 12 }}>
          {loading ? '⏳ Simulating day-by-day...' : '🔮 Run Simulation'}
        </button>
      </div>

      {loading && <div className="loading-box"><div className="spinner" /><p>Digital Twin simulating across 2 plants, 8 RDCs, 6 suppliers...</p></div>}

      {result && (
        <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <h2 className="result-title">{result.scenario_name}</h2>
          <div className="badge-row">
            <span className="badge" style={{ background: '#8b5cf6', color: '#fff' }}>{result.severity}</span>
            <span className="badge-outline">{result.duration_days} days</span>
            <span className="badge-outline">{result.total_financial_impact}</span>
          </div>

          {result.timeline && (
            <div className="section">
              <h3>Day-by-Day Timeline</h3>
              {result.timeline.map((t, i) => (
                <div key={i} className="timeline-row">
                  <div className="timeline-day">Day {t.day}</div>
                  <div className="timeline-content">
                    <strong>{t.event}</strong>
                    <div className="text-muted">🏭 {t.plant_status} · 📦 {t.inventory_impact} · 👥 {t.customer_impact}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.mitigation_plan && (
            <div className="section">
              <h3>Mitigation Plan</h3>
              {result.mitigation_plan.map((m, i) => (
                <div key={i} className="action-row">
                  <div className="action-priority" style={{ background: '#ede9fe', color: '#6d28d9' }}>D{m.day}</div>
                  <div className="action-body">
                    <div className="action-text">{m.action}</div>
                    <div className="action-meta"><span>💰 {m.cost}</span><span>✅ {m.benefit}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.with_vs_without && (
            <div className="section">
              <h3>With AI vs Without</h3>
              <div className="grid-2">
                <div className="compare-box compare-bad">
                  <h4>❌ Without Aeronova AI</h4>
                  <p>Detection: {result.with_vs_without.without_ai?.detection_time}</p>
                  <p>Revenue Lost: {result.with_vs_without.without_ai?.revenue_lost}</p>
                  <p>Extra Cost: {result.with_vs_without.without_ai?.extra_cost}</p>
                  <p>Market Share: {result.with_vs_without.without_ai?.market_share_impact}</p>
                </div>
                <div className="compare-box compare-good">
                  <h4>✅ With Aeronova AI</h4>
                  <p>Detection: {result.with_vs_without.with_aeronova_ai?.detection_time}</p>
                  <p>Revenue Saved: {result.with_vs_without.with_aeronova_ai?.revenue_saved}</p>
                  <p>Cost Avoided: {result.with_vs_without.with_aeronova_ai?.cost_avoided}</p>
                </div>
              </div>
            </div>
          )}

          {result.postponement_cell_response && <div className="highlight-box purple">🏭 {result.postponement_cell_response}</div>}
        </div>
      )}
    </div>
  );
}
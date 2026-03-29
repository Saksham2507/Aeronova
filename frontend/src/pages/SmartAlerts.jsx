import { useState, useEffect } from 'react';
import api from '../services/api';

export default function SmartAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/alerts').then(({ data }) => { setAlerts(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/intelligence/alerts/generate');
      if (data.alerts) setAlerts(prev => [...data.alerts, ...prev]);
    } catch (err) { console.error(err); }
    setGenerating(false);
  };

  const sevColor = (s) => ({ critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#16a34a' }[s] || '#888');
  const catColor = (c) => ({ geopolitical: '#dc2626', weather_event: '#2563eb', commodity_price: '#d97706', regulation_change: '#7c3aed', competitor_move: '#0891b2', anomaly_detected: '#8b5cf6', demand_spike: '#22c55e' }[c] || '#888');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Smart Alerts</h1>
        <p>ML anomaly detection + AI-generated alerts from current events</p>
      </div>

      <div className="card">
        <button className="btn-primary" onClick={generate} disabled={generating}>
          {generating ? '⏳ Scanning global events + ML anomalies...' : '🚨 Generate Live Alerts'}
        </button>
        <p className="text-muted" style={{ marginTop: 8 }}>AI searches current events + ML scans inventory for anomalies</p>
      </div>

      {generating && <div className="loading-box"><div className="spinner" /><p>Scanning geopolitics, weather, commodities, competitors, inventory anomalies...</p></div>}

      {alerts.length > 0 && (
        <div className="alerts-list">
          {alerts.map((a, i) => (
            <div key={a._id || i} className="alert-card" style={{ borderLeft: `4px solid ${sevColor(a.severity)}` }}>
              <div className="alert-header">
                <div>
                  <div className="alert-title">{a.title}</div>
                  <div className="badge-row">
                    <span className="badge" style={{ background: sevColor(a.severity), color: '#fff' }}>{a.severity}</span>
                    <span className="badge" style={{ background: catColor(a.category), color: '#fff' }}>{a.category?.replace(/_/g, ' ')}</span>
                    <span className="badge-outline">{a.source?.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>
              {a.description && <p className="alert-desc">{a.description}</p>}
              {a.recommendedActions?.[0] && (
                <div className="highlight-box green" style={{ marginTop: 8 }}>✅ {a.recommendedActions[0].action}</div>
              )}
              {a.affectedProducts?.length > 0 && (
                <div className="badge-row" style={{ marginTop: 8 }}>
                  {a.affectedProducts.map((p, j) => <span key={j} className="badge-outline">{p}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && alerts.length === 0 && !generating && (
        <div className="card"><p className="empty">No alerts yet. Click "Generate Live Alerts" to scan current events.</p></div>
      )}
    </div>
  );
}
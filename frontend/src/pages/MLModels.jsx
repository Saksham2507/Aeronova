import { useState, useEffect } from 'react';
import api from '../services/api';

export default function MLModels() {
  const [health, setHealth] = useState(null);
  const [demand, setDemand] = useState(null);
  const [clusters, setClusters] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [h, d, c] = await Promise.allSettled([
          api.get('/intelligence/ml/health'),
          api.get('/intelligence/ml/demand'),
          api.get('/intelligence/ml/clusters')
        ]);
        if (h.status === 'fulfilled') setHealth(h.value.data);
        if (d.status === 'fulfilled') setDemand(d.value.data);
        if (c.status === 'fulfilled') setClusters(c.value.data);
      } catch (e) {}
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <div className="page-loading">Loading ML models...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>ML Models</h1>
        <p>5 trained models — LSTM, Isolation Forest, NLP, XGBoost, K-Means</p>
      </div>

      {/* Model Health */}
      {health?.models && (
        <div className="card">
          <h3>Model Status</h3>
          <div className="ml-model-grid">
            {Object.entries(health.models).map(([name, info]) => (
              <div key={name} className="ml-model-card">
                <div className={'status-dot ' + (info.status === 'ready' ? 'dot-green' : 'dot-red')} />
                <div>
                  <div className="ml-card-name">{name.replace(/_/g, ' ')}</div>
                  <div className={'ml-card-status ' + (info.status === 'ready' ? 'text-green' : 'text-red')}>{info.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LSTM Demand Predictions */}
      {demand?.predictions && (
        <div className="card">
          <h3>LSTM Demand Forecast (Next 7 Days)</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Day</th><th>P10 (Low)</th><th>P50 (Expected)</th><th>P90 (High)</th></tr></thead>
              <tbody>
                {demand.predictions.map((p, i) => (
                  <tr key={i}>
                    <td>Day {p.day}</td>
                    <td>{Math.round(p.p10)}</td>
                    <td><strong>{Math.round(p.p50)}</strong></td>
                    <td>{Math.round(p.p90)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* K-Means Clusters */}
      {clusters && (
        <div className="card">
          <h3>RDC Clusters (K-Means)</h3>
          <div className="badge-row" style={{ marginBottom: 16 }}>
            <span className="badge-outline">K = {clusters.n_clusters}</span>
            <span className="badge-outline">Silhouette: {clusters.silhouette_score?.toFixed(3)}</span>
          </div>
          {clusters.cluster_names?.map((name, i) => {
            const rdcs = Object.entries(clusters.assignments || {}).filter(([_, v]) => v.cluster === i);
            return (
              <div key={i} className="cluster-box">
                <h4>Cluster {i}: {name}</h4>
                <div className="badge-row">
                  {rdcs.map(([code, info]) => (
                    <span key={code} className="badge-outline">
                      {code} (avg {info.avg_daily_demand?.toFixed(0)} units/day, {info.avg_temperature?.toFixed(0)}°C)
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
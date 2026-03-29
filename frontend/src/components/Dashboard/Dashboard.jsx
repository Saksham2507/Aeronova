import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/inventory');
        setInventory(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Could not fetch inventory data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <main className="dashboard-main">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e3f2fd' }}>📊</div>
          <div className="stat-info">
            <span className="stat-label">Forecast Accuracy</span>
            <span className="stat-value">82-85%</span>
            <span className="stat-change positive">+37% from 60%</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8f5e9' }}>🔄</div>
          <div className="stat-info">
            <span className="stat-label">Inventory Turns</span>
            <span className="stat-value">7.5x</span>
            <span className="stat-change positive">+53% from 4.9x</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fff3e0' }}>⚡</div>
          <div className="stat-info">
            <span className="stat-label">Response Time</span>
            <span className="stat-value">10-14 days</span>
            <span className="stat-change positive">-95% from 6-8 weeks</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fce4ec' }}>📉</div>
          <div className="stat-info">
            <span className="stat-label">Metro Stockout</span>
            <span className="stat-value">&lt;5%</span>
            <span className="stat-change positive">From 18-22%</span>
          </div>
        </div>
      </div>

      {/* Demand Sensing Score */}
      <DemandScoringWidget />

      {/* Inventory Table */}
      <section className="dashboard-section">
        <h2>Inventory Levels</h2>
        {loading && <p className="section-msg">Loading inventory data...</p>}
        {error && <p className="section-msg error">{error}</p>}
        {!loading && !error && inventory.length === 0 && (
          <div className="empty-state">
            <p>No inventory data yet.</p>
            <p className="hint">Add data via MongoDB:<br/>
              <code>db.inventories.insertMany([
  {'{'} rdcId: "delhi", sku: "SKU001", currentQuantity: 500, stockStatus: "normal" {'}'},
  {'{'} rdcId: "mumbai", sku: "SKU002", currentQuantity: 300, stockStatus: "warning" {'}'},
  {'{'} rdcId: "bangalore", sku: "SKU003", currentQuantity: 800, stockStatus: "normal" {'}'}
])</code></p>
          </div>
        )}
        {inventory.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>RDC</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.rdcId || 'N/A'}</td>
                  <td>{item.sku || 'N/A'}</td>
                  <td>{item.currentQuantity || 0}</td>
                  <td>
                    <span className={'status-badge status-' + (item.stockStatus || 'normal')}>
                      {item.stockStatus || 'normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

/* Demand Sensing Scoring Widget */
function DemandScoringWidget() {
  const [params, setParams] = useState({
    socialMedia: 30,
    weather: 50,
    searchTrends: 25,
    ecommerce: 40,
    promo: 10,
    supplier: 80
  });

  const weights = {
    socialMedia: 0.20,
    weather: 0.25,
    searchTrends: 0.20,
    ecommerce: 0.20,
    promo: 0.10,
    supplier: 0.05
  };

  const score = Math.round(
    params.socialMedia * weights.socialMedia +
    params.weather * weights.weather +
    params.searchTrends * weights.searchTrends +
    params.ecommerce * weights.ecommerce +
    params.promo * weights.promo +
    params.supplier * weights.supplier
  );

  const getScoreLevel = (s) => {
    if (s >= 75) return { label: 'CRITICAL', color: '#d32f2f' };
    if (s >= 50) return { label: 'WARNING', color: '#f57c00' };
    return { label: 'NORMAL', color: '#388e3c' };
  };

  const level = getScoreLevel(score);

  const labels = {
    socialMedia: 'Social Media',
    weather: 'Weather Alert',
    searchTrends: 'Search Trends',
    ecommerce: 'E-commerce Signal',
    promo: 'Promo Intensity',
    supplier: 'Supplier Capacity'
  };

  return (
    <section className="dashboard-section">
      <h2>AI Demand Sensing Score</h2>
      <div className="scoring-widget">
        <div className="score-display">
          <div className="score-circle" style={{ borderColor: level.color }}>
            <span className="score-number" style={{ color: level.color }}>{score}</span>
            <span className="score-label">{level.label}</span>
          </div>
        </div>
        <div className="sliders-grid">
          {Object.entries(params).map(([key, value]) => (
            <div key={key} className="slider-row">
              <label>{labels[key]}</label>
              <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => setParams({ ...params, [key]: Number(e.target.value) })}
              />
              <span className="slider-value">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="scenario-buttons">
        <button onClick={() => setParams({ socialMedia: 30, weather: 50, searchTrends: 25, ecommerce: 40, promo: 10, supplier: 80 })}>
          Normal Day
        </button>
        <button onClick={() => setParams({ socialMedia: 85, weather: 95, searchTrends: 90, ecommerce: 70, promo: 20, supplier: 60 })}>
          Monsoon Crisis
        </button>
        <button onClick={() => setParams({ socialMedia: 60, weather: 30, searchTrends: 95, ecommerce: 100, promo: 100, supplier: 70 })}>
          Flash Sale
        </button>
      </div>
    </section>
  );
}
import { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [mlHealth, setMlHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ovr, inv, ml] = await Promise.allSettled([
          api.get('/dashboard/overview'),
          api.get('/inventory/summary'),
          api.get('/intelligence/ml/health')
        ]);
        if (ovr.status === 'fulfilled') setOverview(ovr.value.data);
        if (inv.status === 'fulfilled') setInventory(inv.value.data);
        if (ml.status === 'fulfilled') setMlHealth(ml.value.data);
      } catch (e) {}
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard...</div>;

  const kpis = [
    { label: 'Forecast Accuracy', value: '82-85%', change: '+37% from 60%', color: '#6366f1' },
    { label: 'Inventory Turns', value: '7.5x', change: '+53% from 4.9x', color: '#22c55e' },
    { label: 'Response Time', value: '10-14 days', change: '-95% from 6-8 weeks', color: '#f59e0b' },
    { label: 'Metro Stockout', value: '<5%', change: 'From 18-22%', color: '#ef4444' },
  ];

  const inventoryChart = inventory.map(i => ({
    name: i._id?.replace('RDC-', '') || 'Unknown',
    stock: i.totalStock || 0,
    critical: i.criticalCount || 0,
    warning: i.warningCount || 0
  }));

  const mlModels = mlHealth?.models ? Object.entries(mlHealth.models).map(([name, info]) => ({
    name: name.replace(/_/g, ' '),
    status: info.status
  })) : [];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Command Center</h1>
        <p>Real-time overview of Aeronova's AI-powered supply chain</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map((kpi, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="kpi-change">{kpi.change}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Inventory by RDC */}
        <div className="card">
          <h3>Inventory by RDC</h3>
          {inventoryChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={inventoryChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="stock" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="empty">No inventory data</p>}
        </div>

        {/* ML Model Status */}
        <div className="card">
          <h3>ML Model Status</h3>
          <div className="ml-status-grid">
            {mlModels.map((m, i) => (
              <div key={i} className="ml-status-item">
                <span className={'status-dot ' + (m.status === 'ready' ? 'dot-green' : 'dot-red')} />
                <span className="ml-model-name">{m.name}</span>
                <span className={'ml-model-status ' + (m.status === 'ready' ? 'text-green' : 'text-red')}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>

          {overview && (
            <div className="overview-stats">
              <div className="stat-row">
                <span>Active Products</span>
                <span className="stat-val">{overview.products?.active || 0}</span>
              </div>
              <div className="stat-row">
                <span>Active Alerts</span>
                <span className="stat-val text-red">{overview.alerts?.active || 0}</span>
              </div>
              <div className="stat-row">
                <span>Suppliers at Risk</span>
                <span className="stat-val text-amber">{overview.suppliers?.atRisk || 0}</span>
              </div>
              <div className="stat-row">
                <span>Critical Inventory</span>
                <span className="stat-val text-red">{overview.inventory?.criticalItems || 0}</span>
              </div>
              <div className="stat-row">
                <span>ML Anomalies</span>
                <span className="stat-val text-purple">{overview.inventory?.anomalies || 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
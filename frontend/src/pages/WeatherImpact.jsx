import { useState } from 'react';
import api from '../services/api';

const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Kolkata', 'Chennai', 'Pune', 'Noida'];

export default function WeatherImpact() {
  const [city, setCity] = useState('Delhi');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true); setResult(null);
    try {
      const { data } = await api.post('/intelligence/weather', { city });
      setResult(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const pred = result?.ai_prediction;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Weather → Demand Predictor</h1>
        <p>Real weather → LSTM model → AI predicts products, colors, and actions</p>
      </div>

      <div className="card">
        <div className="city-grid">
          {cities.map(c => (
            <button key={c} className={'city-btn' + (city === c ? ' city-active' : '')} onClick={() => setCity(c)}>{c}</button>
          ))}
          <button className="btn-primary" onClick={analyze} disabled={loading}>{loading ? '⏳ Analyzing...' : '🌦 Predict Impact'}</button>
        </div>
      </div>

      {loading && <div className="loading-box"><div className="spinner" /><p>Fetching weather → Running LSTM → AI predicting demand shifts...</p></div>}

      {result?.weather && (
        <div className="card">
          <h3>Weather — {result.weather.city || city}</h3>
          <div className="weather-display">
            <div className="weather-main">
              <div className="temp-big">{result.weather.current_temp_c}°C</div>
              <div>{result.weather.condition}</div>
              <div className="text-muted">Humidity: {result.weather.humidity}%</div>
            </div>
            {result.weather.forecast && (
              <div className="forecast-row">
                {result.weather.forecast.slice(0, 7).map((f, i) => (
                  <div key={i} className="forecast-day">
                    <div className="f-day">{f.day}</div>
                    <div className="f-temp">{f.high}°/{f.low}°</div>
                    <div className="f-cond">{f.condition}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {pred && (
        <div className="card" style={{ borderLeft: '4px solid #6366f1' }}>
          <h3>AI Demand Prediction</h3>
          <div className="demand-grid">
            {pred.demand_predictions?.map((d, i) => (
              <div key={i} className="demand-card">
                <div className="demand-product">{d.product}</div>
                <div className={'demand-change ' + (d.change_percent > 0 ? 'text-green' : d.change_percent < 0 ? 'text-red' : '')}>
                  {d.change_percent > 0 ? '▲' : d.change_percent < 0 ? '▼' : '—'} {Math.abs(d.change_percent)}%
                </div>
                <div className="text-muted">{d.reasoning}</div>
              </div>
            ))}
          </div>
          {pred.color_shift && (
            <div className="section">
              <h3>Color Preference Shift</h3>
              <div className="badge-row">
                {pred.color_shift.trending_up?.map((c, i) => <span key={i} className="badge-green">▲ {c}</span>)}
                {pred.color_shift.trending_down?.map((c, i) => <span key={i} className="badge-red">▼ {c}</span>)}
              </div>
              <p className="text-muted">{pred.color_shift.reason}</p>
            </div>
          )}
          {pred.postponement_cell_action && <div className="highlight-box purple">🏭 {pred.postponement_cell_action}</div>}
          {pred.revenue_opportunity && <div className="highlight-box green">💰 {pred.revenue_opportunity}</div>}
        </div>
      )}
    </div>
  );
}
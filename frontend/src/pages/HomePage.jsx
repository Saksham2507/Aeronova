import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">Aeronova</h1>
        <p className="home-subtitle">Supply Chain Optimization Platform</p>
        <p className="home-desc">Real-time demand sensing &amp; inventory management</p>
        <div className="home-links">
          <Link to="/login" className="btn btn-primary">Login</Link>
          <Link to="/register" className="btn btn-secondary">Register</Link>
        </div>
      </div>
    </div>
  );
}
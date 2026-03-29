import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊', end: true },
  { path: '/cascade', label: 'Cascade Mapper', icon: '🌐' },
  { path: '/news', label: 'News Intelligence', icon: '📰' },
  { path: '/weather', label: 'Weather Impact', icon: '🌦' },
  { path: '/twin', label: 'Digital Twin', icon: '🔮' },
  { path: '/alerts', label: 'Smart Alerts', icon: '🚨' },
  { path: '/ml', label: 'ML Models', icon: '🧠' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">A</div>
          <div>
            <div className="logo-name">Aeronova</div>
            <div className="logo-sub">AI Supply Intelligence</div>
          </div>
        </div>

        <div className="nav-list">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => 'nav-item' + (isActive ? ' nav-active' : '')}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-avatar">{user?.name?.[0] || 'U'}</span>
            <div>
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-role">{user?.role || 'viewer'}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
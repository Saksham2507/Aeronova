import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';
import Dashboard from './pages/Dashboard';
import CascadeMapper from './pages/CascadeMapper';
import NewsIntelligence from './pages/NewsIntelligence';
import WeatherImpact from './pages/WeatherImpact';
import DigitalTwin from './pages/DigitalTwin';
import SmartAlerts from './pages/SmartAlerts';
import MLModels from './pages/MLModels';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="cascade" element={<CascadeMapper />} />
          <Route path="news" element={<NewsIntelligence />} />
          <Route path="weather" element={<WeatherImpact />} />
          <Route path="twin" element={<DigitalTwin />} />
          <Route path="alerts" element={<SmartAlerts />} />
          <Route path="ml" element={<MLModels />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
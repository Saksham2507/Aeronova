import { useState, useEffect } from 'react';
import api from '../services/api';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      try { setUser(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      setError(msg); throw new Error(msg);
    } finally { setLoading(false); }
  };

  const register = async (name, email, password) => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      setError(msg); throw new Error(msg);
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isLoggedIn = () => !!localStorage.getItem('token');

  return { user, loading, error, login, register, logout, isLoggedIn };
}
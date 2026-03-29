import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, loading, error } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) await register(name, email, password);
      else await login(email, password);
      navigate('/');
    } catch (err) {}
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit} className="login-form">
        <div className="login-logo">A</div>
        <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
        <p className="login-sub">Aeronova AI Supply Chain Intelligence</p>
        {error && <div className="error-msg">{error}</div>}
        {isRegister && (
          <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
        )}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
        </button>
        <p className="toggle-auth" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </p>
        <p className="demo-hint">Demo: demo@aeronova.com / demo123456</p>
      </form>
    </div>
  );
}
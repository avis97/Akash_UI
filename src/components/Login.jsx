import React, { useState } from 'react';
import { API_URL } from '../config/api';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  Briefcase, 
  UserCheck, 
  ArrowRight 
} from 'lucide-react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [activeRole, setActiveRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(API_URL('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        onLogin(data);
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login request failed:', err);
      setError('Unable to connect to login server. Please verify server status.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword, roleKey) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setActiveRole(roleKey);
    setError('');
  };

  return (
    <div className="login-root">
      {/* Ambient background glow accents */}
      <div className="bg-glow-top"></div>
      <div className="bg-glow-bottom"></div>

      <div className="simple-login-container">
        <div className="login-card">
          <header className="card-header">
            <div className="logo-box">
              <img 
                src="/logo.webp" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://blanchedalmond-bat-253605.hostingersite.com//storage/uploads/logo/2-logo-dark.png";
                }}
                alt="Akash Engineering" 
                className="logo-img"
              />
            </div>
            <h2 className="card-title">Welcome Back</h2>
            <p className="card-subtitle">Sign in to access your portal</p>
          </header>

          {error && (
            <div className="login-error-alert">
              <span>⚠️ {error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-input" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <button 
                  type="button" 
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Quick Demo Access Selectors */}
            <div className="demo-roles-box">
              <span className="demo-title">Quick Demo Login:</span>
              <div className="demo-buttons">
                <button
                  type="button"
                  className={`demo-btn demo-superadmin ${activeRole === 'superadmin' ? 'active' : ''}`}
                  onClick={() => handleQuickFill('superadmin@example.com', 'password123', 'superadmin')}
                >
                  <Shield size={13} />
                  <span>Superadmin</span>
                </button>
                <button
                  type="button"
                  className={`demo-btn demo-employee ${activeRole === 'employee' ? 'active' : ''}`}
                  onClick={() => handleQuickFill('employee@akashcrm.com', 'password123', 'employee')}
                >
                  <Briefcase size={13} />
                  <span>Employee</span>
                </button>
                <button
                  type="button"
                  className={`demo-btn demo-client ${activeRole === 'client' ? 'active' : ''}`}
                  onClick={() => handleQuickFill('client@akashcrm.com', 'password123', 'client')}
                >
                  <UserCheck size={13} />
                  <span>Client</span>
                </button>
              </div>
            </div>

            <div className="form-actions">
              <label className="remember-label">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                  className="checkbox-input"
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>
                Forgot password?
              </a>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner"></span>
                  Signing In...
                </span>
              ) : (
                <span className="btn-content">
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>

          <footer className="card-footer">
            <span>&copy; 2026 Akash Engineering. All rights reserved.</span>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;

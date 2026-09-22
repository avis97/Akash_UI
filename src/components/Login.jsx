import React, { useState } from 'react';
import { API_URL } from '../config/api';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        
        <header className="login-header">
          <img 
            src="/logo.webp" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://blanchedalmond-bat-253605.hostingersite.com//storage/uploads/logo/2-logo-dark.png";
            }}
            alt="Akash Engineering" 
            style={{ height: '50px', objectFit: 'contain' }}
          />
        </header>

        <main className="login-main">
          <div className="login-card">
            <h2 className="login-title">Welcome Back</h2>
            {error && <div className="login-error">{error}</div>}
            
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>

              {/* Quick Demo Login Selectors for the 3 Primary Roles */}
              <div style={{ margin: '1rem 0', display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.08)', color: '#7e22ce', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => handleQuickFill('superadmin@example.com', 'password123')}
                >
                  🛡️ Superadmin
                </button>
                <button
                  type="button"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.08)', color: '#1d4ed8', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => handleQuickFill('employee@akashcrm.com', 'password123')}
                >
                  💼 Employee
                </button>
                <button
                  type="button"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.08)', color: '#047857', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => handleQuickFill('client@akashcrm.com', 'password123')}
                >
                  🤝 Client
                </button>
              </div>

              <div className="form-options">
                <a href="#" className="forgot-password">Forgot password?</a>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        </main>
        
        <footer className="login-footer">
          <span>&copy; 2026 Akash Engineering. All rights reserved.</span>
        </footer>
      </div>
    </div>
  );
};

export default Login;


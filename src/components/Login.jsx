import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === 'company@example.com' && password === '1234') {
      setError('');
      onLogin({ email, role: 'master' });
    } else {
      setError('Invalid credentials. Please use company@example.com / 1234');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        
        <header className="login-header">
          <img 
            src="https://blanchedalmond-bat-253605.hostingersite.com//storage/uploads/logo/2-logo-dark.png" 
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

              <div className="form-options">
                <a href="#" className="forgot-password">Forgot password?</a>
              </div>

              <button type="submit" className="btn-login">Sign In</button>
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

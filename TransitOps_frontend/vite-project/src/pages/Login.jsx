import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Mail, Lock, ArrowRight, Loader2, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState('FLEET_MANAGER');

  const { login, register, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegistering) {
        await register(name, email, password, roleName);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      // error is already set in context
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setError(null);
    setEmail(demoEmail);
    setPassword(demoPassword);
    try {
      await login(demoEmail, demoPassword);
      navigate('/dashboard');
    } catch (err) {
      // If demo user isn't registered yet in DB, register them automatically
      if (err.status === 401 || err.status === 404 || err.message?.toLowerCase().includes('bad credentials')) {
        try {
          await register(
            demoEmail === 'manager@transitops.com' ? 'Alice Manager' : 'John Driver',
            demoEmail,
            demoPassword,
            demoEmail === 'manager@transitops.com' ? 'FLEET_MANAGER' : 'DRIVER'
          );
          navigate('/dashboard');
        } catch (regErr) {
          // error handled by context
        }
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Bus size={32} strokeWidth={2.5} className="logo-icon" />
          <h1>TransitOps</h1>
          <p>Smart Fleet & Operations Management</p>
        </div>

        <div className="login-mode-tabs">
          <button
            type="button"
            className={`mode-tab ${!isRegistering ? 'active' : ''}`}
            onClick={() => { setIsRegistering(false); setError(null); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`mode-tab ${isRegistering ? 'active' : ''}`}
            onClick={() => { setIsRegistering(true); setError(null); }}
          >
            Register Account
          </button>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {isRegistering && (
            <>
              <div className="input-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input 
                    type="text" 
                    placeholder="Alice Manager"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>System Role (RBAC)</label>
                <div className="input-wrapper">
                  <ShieldCheck className="input-icon" size={18} />
                  <select
                    className="role-select"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    disabled={loading}
                  >
                    <option value="FLEET_MANAGER">Fleet Manager (Full CRUD)</option>
                    <option value="DRIVER">Driver (Trips Access)</option>
                    <option value="SAFETY_OFFICER">Safety Officer (Driver & Compliance Access)</option>
                    <option value="FINANCIAL_ANALYST">Financial Analyst (Reports & Costs Access)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input 
                type="email" 
                placeholder="operator@transitops.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin-icon" /> {isRegistering ? 'Registering...' : 'Signing in...'}
              </>
            ) : (
              <>
                {isRegistering ? 'Create Account & Sign In' : 'Sign In'} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="demo-accounts-box">
          <div className="demo-title">Or instant login with Demo Credentials:</div>
          <div className="demo-buttons">
            <button
              type="button"
              className="demo-btn"
              onClick={() => handleDemoLogin('manager@transitops.com', 'password123')}
              disabled={loading}
            >
              Fleet Manager Demo
            </button>
            <button
              type="button"
              className="demo-btn demo-btn-outline"
              onClick={() => handleDemoLogin('driver@transitops.com', 'password123')}
              disabled={loading}
            >
              Driver Demo
            </button>
          </div>
        </div>

        <div className="login-footer">
          <a href="#">Forgot Password?</a>
          <a href="#">System API Documentation</a>
        </div>
      </div>
    </div>
  );
}

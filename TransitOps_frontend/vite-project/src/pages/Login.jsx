import React from 'react';
import { Bus, Mail, Lock, ArrowRight } from 'lucide-react';
import './Login.css';

export default function Login() {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Bus size={32} strokeWidth={2.5} className="logo-icon" />
          <h1>TransitOps</h1>
          <p>Fleet Management Portal</p>
        </div>

        <form className="login-form">
          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input type="email" placeholder="operator@transitops.com" />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input type="password" placeholder="........" />
            </div>
          </div>

          <button type="submit" className="login-btn">
            Sign In <ArrowRight size={18} />
          </button>
        </form>

        <div className="login-footer">
          <a href="#">Forgot Password?</a>
          <a href="#">Contact Administrator</a>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Truck, LayoutDashboard, Route as RouteIcon, History, Settings, HelpCircle, 
  Search, Bell, Plus, Wrench, BarChart2, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './MainLayout.css';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <Truck className="logo-icon-small" size={24} />
            <div>
              <span className="logo-title">TransitOps</span>
              <span className="logo-subtitle">FLEET CONTROL</span>
            </div>
          </div>
          <button className="new-dispatch-btn" onClick={() => navigate('/dispatch')}>
            <Plus size={16} /> NEW DISPATCH
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={18} /> DASHBOARD
          </NavLink>
          <NavLink to="/directory" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Truck size={18} /> FLEET & DRIVERS
          </NavLink>
          <NavLink to="/dispatch" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <RouteIcon size={18} /> DISPATCH
          </NavLink>
          <NavLink to="/triplogs" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <History size={18} /> TRIP LOGS
          </NavLink>
          <NavLink to="/maintenance" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Wrench size={18} /> MAINTENANCE
          </NavLink>
          <NavLink to="/reports" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <BarChart2 size={18} /> REPORTS
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Header */}
        <header className="topbar">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input type="text" placeholder="Search vehicles, drivers..." />
          </div>
          <div className="topbar-actions">
            <button className="icon-btn"><Bell size={18} /></button>
            <button className="icon-btn"><HelpCircle size={18} /></button>
            <button className="icon-btn"><Settings size={18} /></button>
            <button className="icon-btn" onClick={handleLogout} title="Sign Out"><LogOut size={18} /></button>
            <div className="user-profile">
              <div className="avatar">
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" />
              </div>
              <span className="user-name">{user?.name || 'Operator'}</span>
              <span className="user-role">{user?.role?.replace('_', ' ') || 'ADMIN'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

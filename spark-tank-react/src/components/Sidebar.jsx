import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isAdmin } = useAuth();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <img
          src="https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/090/511/original/Copy_of_Logo-White.png?1727164234"
          alt="Scaler Logo"
          className="sidebar-logo"
        />
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <span className="toggle-icon">‹</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        <Link to="/home" className={`nav-item ${isActive('/home') ? 'active' : ''}`}>
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </Link>
        <Link to="/groupview" className={`nav-item ${isActive('/groupview') ? 'active' : ''}`}>
          <span className="nav-icon">👥</span>
          <span className="nav-label">Group View</span>
        </Link>
        {isAdmin() && (
          <Link to="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
            <span className="nav-icon">🔧</span>
            <span className="nav-label">Admin</span>
          </Link>
        )}
        <Link to="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </Link>
      </nav>
    </aside>
  );
}

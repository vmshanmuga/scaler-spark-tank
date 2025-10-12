import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Topbar.css';

export default function Topbar({
  breadcrumb = ['Home', 'Home'],
  showLiveDashboard = true,
  onToggleSidebar
}) {
  const { signOut, userAccess } = useAuth();
  const [theme, setTheme] = useState('dark');

  // Get user info for welcome message
  const userName = userAccess?.Name || userAccess?.name || 'User';
  const accessType = userAccess?.['Access Type'] || userAccess?.accessType;
  const groupName = userAccess?.['Group Name'] || userAccess?.groupName;

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      try {
        await signOut();
      } catch (error) {
        console.error('Sign out error:', error);
      }
    }
  };

  const handleViewLiveDashboard = () => {
    window.open('/live-dashboard', '_blank');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onToggleSidebar}>
          <span className="menu-icon">☰</span>
        </button>

        <div className="breadcrumb">
          <span className="breadcrumb-item">{breadcrumb[0]}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item active">{breadcrumb[1]}</span>
        </div>
      </div>

      {showLiveDashboard && (
        <div className="topbar-center">
          <button
            className="btn-live-dashboard"
            onClick={handleViewLiveDashboard}
          >
            <span className="live-pulse"></span>
            <span>View Live Dashboard</span>
          </button>
        </div>
      )}

      <div className="topbar-right">
        <div className="user-welcome">
          <span className="welcome-text">
            Welcome, {userName}
          </span>
          {accessType === 'Admin' ? (
            <span className="user-badge admin-badge">🔧 Admin</span>
          ) : (
            <span className="user-badge student-badge">📚 {groupName || 'Student'}</span>
          )}
        </div>

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          <span className="theme-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
        </button>

        <button
          className="power-btn"
          onClick={handleSignOut}
          title="Sign out"
        >
          <span className="power-icon">⏻</span>
        </button>
      </div>
    </header>
  );
}

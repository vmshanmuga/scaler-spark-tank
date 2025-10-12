import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMetadata, useLeaderboardData, useLastSync } from '../hooks/useFirebaseData';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import './Settings.css';

export default function Settings() {
  const { user, userAccess, signOut } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');
  const [autoSync, setAutoSync] = useState(true);
  const [saleCelebrations, setSaleCelebrations] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [lastSyncFormatted, setLastSyncFormatted] = useState('--');

  const { data: metadata } = useMetadata();
  const { data: leaderboardData } = useLeaderboardData();
  const { data: lastSyncData } = useLastSync();

  const totalSales = metadata?.totalSales || 0;
  const totalOrders = metadata?.totalOrders || 0;
  const activeTeams = leaderboardData ? Object.keys(leaderboardData).length : 0;

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
  }, []);

  // Update last sync time - updates every second
  useEffect(() => {
    const updateLastSync = () => {
      if (lastSyncData) {
        const date = new Date(lastSyncData);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) {
          setLastSyncFormatted(`${diff}s ago`);
        } else if (diff < 3600) {
          setLastSyncFormatted(`${Math.floor(diff / 60)}m ago`);
        } else if (diff < 86400) {
          setLastSyncFormatted(`${Math.floor(diff / 3600)}h ago`);
        } else {
          setLastSyncFormatted(date.toLocaleDateString());
        }
      } else {
        setLastSyncFormatted('--');
      }
    };

    // Update immediately
    updateLastSync();

    // Update every second to keep the time accurate
    const interval = setInterval(updateLastSync, 1000);

    return () => clearInterval(interval);
  }, [lastSyncData]);

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
        navigate('/login');
      } catch (error) {
        console.error('Sign out error:', error);
      }
    }
  };

  const handleSyncNow = () => {
    alert('Sync functionality will trigger the Google Apps Script to sync data from Sheets to Firebase.');
  };

  const handleExportCSV = () => {
    alert('Exporting leaderboard data to CSV...');
  };

  const handleRefreshDashboard = () => {
    window.location.reload();
  };

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear the browser cache? This will reload the page.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleViewLogs = () => {
    alert('Sync logs functionality coming soon!');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Topbar breadcrumb={['Settings', 'Preferences']} showLiveDashboard={false} />

        {/* Animated Background */}
        <div className="dashboard-bg">
          <div className="bg-orb bg-orb-1"></div>
          <div className="bg-orb bg-orb-2"></div>
          <div className="bg-orb bg-orb-3"></div>
        </div>

        <main className="content-area">
          <div className="settings-container">
            {/* Header */}
            <div className="settings-header">
              <div className="settings-header-content">
                <span className="settings-icon">⚙️</span>
                <div>
                  <h1 className="settings-title">Settings</h1>
                  <p className="settings-subtitle">Manage sync controls, quick actions, and system preferences</p>
                </div>
              </div>
            </div>

            <div className="settings-grid">
              {/* Sync Control Card */}
              <div className="settings-card">
                <div className="card-header">
                  <div className="card-icon">🔄</div>
                  <div>
                    <h2 className="card-title">Sync Control</h2>
                    <p className="card-description">Manage data synchronization between Google Sheets and Firebase</p>
                  </div>
                </div>
                <div className="card-content">
                  <div className="sync-info-grid">
                    <div className="sync-info-item">
                      <span className="sync-info-label">Last Sync:</span>
                      <span className="sync-info-value">{lastSyncFormatted}</span>
                    </div>
                    <div className="sync-info-item">
                      <span className="sync-info-label">Sync Status:</span>
                      <span className="sync-info-value status-active">Active</span>
                    </div>
                    <div className="sync-info-item">
                      <span className="sync-info-label">Auto-Sync:</span>
                      <span className="sync-info-value">Every 5 minutes</span>
                    </div>
                  </div>
                  <button className="action-btn primary-btn" onClick={handleSyncNow}>
                    <span className="btn-icon">🔄</span>
                    <span>Sync Now</span>
                  </button>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="settings-card">
                <div className="card-header">
                  <div className="card-icon">⚡</div>
                  <div>
                    <h2 className="card-title">Quick Actions</h2>
                    <p className="card-description">Shortcuts for common administrative tasks</p>
                  </div>
                </div>
                <div className="card-content">
                  <div className="quick-actions-grid">
                    <button className="quick-action-btn" onClick={handleExportCSV}>
                      <span className="quick-action-icon">📥</span>
                      <span className="quick-action-label">Export Leaderboard (CSV)</span>
                    </button>
                    <button className="quick-action-btn" onClick={handleRefreshDashboard}>
                      <span className="quick-action-icon">🔃</span>
                      <span className="quick-action-label">Refresh Dashboard Data</span>
                    </button>
                    <button className="quick-action-btn" onClick={handleClearCache}>
                      <span className="quick-action-icon">🗑️</span>
                      <span className="quick-action-label">Clear Browser Cache</span>
                    </button>
                    <button className="quick-action-btn" onClick={handleViewLogs}>
                      <span className="quick-action-icon">📋</span>
                      <span className="quick-action-label">View Sync Logs</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* System Information Card */}
              <div className="settings-card">
                <div className="card-header">
                  <div className="card-icon">ℹ️</div>
                  <div>
                    <h2 className="card-title">System Information</h2>
                    <p className="card-description">Current system status and configuration</p>
                  </div>
                </div>
                <div className="card-content">
                  <div className="system-info-grid">
                    <div className="system-info-item">
                      <span className="system-info-label">Total Sales:</span>
                      <span className="system-info-value">{formatCurrency(totalSales)}</span>
                    </div>
                    <div className="system-info-item">
                      <span className="system-info-label">Total Orders:</span>
                      <span className="system-info-value">{totalOrders}</span>
                    </div>
                    <div className="system-info-item">
                      <span className="system-info-label">Active Teams:</span>
                      <span className="system-info-value">{activeTeams}</span>
                    </div>
                    <div className="system-info-item">
                      <span className="system-info-label">Database Status:</span>
                      <span className="system-info-value status-connected">Connected</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Preferences Card */}
              <div className="settings-card">
                <div className="card-header">
                  <div className="card-icon">🎨</div>
                  <div>
                    <h2 className="card-title">Display Preferences</h2>
                    <p className="card-description">Customize how the dashboard appears</p>
                  </div>
                </div>
                <div className="card-content">
                  <div className="preference-list">
                    <div className="preference-item">
                      <div className="preference-info">
                        <span className="preference-icon">🌓</span>
                        <div className="preference-text">
                          <span className="preference-label">Theme</span>
                          <span className="preference-description">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                        </div>
                      </div>
                      <button
                        className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}
                        onClick={toggleTheme}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                    <div className="preference-item">
                      <div className="preference-info">
                        <span className="preference-icon">🎉</span>
                        <div className="preference-text">
                          <span className="preference-label">Sale Celebrations</span>
                          <span className="preference-description">{saleCelebrations ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                      <button
                        className={`toggle-switch ${saleCelebrations ? 'active' : ''}`}
                        onClick={() => setSaleCelebrations(!saleCelebrations)}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                    <div className="preference-item">
                      <div className="preference-info">
                        <span className="preference-icon">🔔</span>
                        <div className="preference-text">
                          <span className="preference-label">Notifications</span>
                          <span className="preference-description">{notifications ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                      <button
                        className={`toggle-switch ${notifications ? 'active' : ''}`}
                        onClick={() => setNotifications(!notifications)}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

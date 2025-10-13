import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  useLeaderboardData,
  useTransactionsData,
  useMetadata,
  useLastSync
} from '../hooks/useFirebaseData';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import DropshippingLoader from '../components/DropshippingLoader';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const { data: leaderboardData, loading: leaderboardLoading } = useLeaderboardData();
  const { data: transactionsData, loading: transactionsLoading } = useTransactionsData();
  const { data: metadata } = useMetadata();
  const { data: lastSyncData } = useLastSync();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('--');

  // Calculate stats from metadata
  const totalSales = metadata?.totalSales || 0;
  const totalOrders = metadata?.totalOrders || 0;
  const activeTeams = leaderboardData ? Object.keys(leaderboardData).length : 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  // Convert leaderboard object to sorted array
  // Separate teams with sales vs no sales
  const allTeams = leaderboardData ? Object.values(leaderboardData) : [];

  const teamsWithSales = allTeams.filter(
    team => (team.totalSales > 0) || (team.orderCount > 0)
  ).sort((a, b) => b.totalSales - a.totalSales);

  const teamsWithoutSales = allTeams.filter(
    team => (!team.totalSales || team.totalSales === 0) && (!team.orderCount || team.orderCount === 0)
  );

  // Combine: ranked teams first, then unranked teams
  const leaderboard = [...teamsWithSales, ...teamsWithoutSales];

  // Convert transactions to array
  const transactions = transactionsData
    ? Object.values(transactionsData).sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      ).slice(0, 10)
    : [];

  // Update last sync time - updates every second
  useEffect(() => {
    const updateLastSync = () => {
      if (lastSyncData) {
        const date = new Date(lastSyncData);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) {
          setLastUpdated(`${diff}s ago`);
        } else if (diff < 3600) {
          setLastUpdated(`${Math.floor(diff / 60)}m ago`);
        } else if (diff < 86400) {
          setLastUpdated(`${Math.floor(diff / 3600)}h ago`);
        } else {
          setLastUpdated(date.toLocaleDateString());
        }
      } else {
        setLastUpdated('--');
      }
    };

    // Update immediately
    updateLastSync();

    // Update every second to keep the time accurate
    const interval = setInterval(updateLastSync, 1000);

    return () => clearInterval(interval);
  }, [lastSyncData]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
  };

  const getHustleMessage = () => {
    const messages = [
      "🚀 Time to make your first sale! Let's go!",
      "💪 Every champion was once a beginner. Start now!",
      "🔥 The best time to start is NOW!",
      "⚡ Your first sale is waiting. Go get it!",
      "🎯 Success starts with action. Make it happen!",
      "💎 Turn that zero into a hero! Start selling!",
      "🌟 Great things start with small steps. Take yours!",
      "🏆 Winners make moves. Time to shine!",
      "⭐ Every sale begins with the first one. Go!",
      "🚀 The journey to success starts today!"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Show loader if both leaderboard and transactions are loading
  if (leaderboardLoading && transactionsLoading) {
    return <DropshippingLoader />;
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <div className={`main-area ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Topbar onToggleSidebar={toggleSidebar} />

        {/* Animated Background */}
        <div className="dashboard-bg">
          <div className="bg-orb bg-orb-1"></div>
          <div className="bg-orb bg-orb-2"></div>
          <div className="bg-orb bg-orb-3"></div>
        </div>

        {/* Main Content */}
        <main className="content-area">
          {/* Stats Cards */}
          <section className="stats-section">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-details">
                <div className="stat-label">Total Sales</div>
                <div className="stat-value">{formatCurrency(totalSales)}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-details">
                <div className="stat-label">Total Orders</div>
                <div className="stat-value">{totalOrders}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-details">
                <div className="stat-label">Active Teams</div>
                <div className="stat-value">{activeTeams}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-details">
                <div className="stat-label">Avg Order Value</div>
                <div className="stat-value">{formatCurrency(avgOrderValue)}</div>
              </div>
            </div>
          </section>

          {/* Leaderboard Section */}
          <section className="leaderboard-section">
            <div className="section-header">
              <h2 className="section-title">🏆 Leaderboard</h2>
              <div className="live-indicator">
                <span className="live-dot"></span>
                <span>LIVE</span>
                <span>•</span>
                <span>Last updated: {lastUpdated}</span>
              </div>
            </div>

            {leaderboardLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading leaderboard...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h2>No Data Available</h2>
                <p>The leaderboard will appear once sales data is synced from Google Sheets.</p>
              </div>
            ) : (
              <div className="leaderboard">
                {leaderboard.map((team, index) => {
                  // Check if team has sales or orders
                  const hasSales = (team.totalSales > 0) || (team.orderCount > 0);
                  // Calculate rank only for teams with sales
                  const teamRank = hasSales ? teamsWithSales.findIndex(t => t.teamName === team.teamName) + 1 : null;

                  return (
                    <div
                      key={team.teamName || index}
                      className="leaderboard-card"
                      data-rank={teamRank || 'unranked'}
                    >
                      <div className="card-content">
                        <div className="card-left">
                          <div className="rank-badge">
                            {hasSales ? (
                              <>
                                {getRankIcon(teamRank)}
                                <span className="rank-number">#{teamRank}</span>
                              </>
                            ) : (
                              <>
                                <span style={{ fontSize: '1.5rem' }}>➖</span>
                                <span className="rank-number">Not Ranked</span>
                              </>
                            )}
                          </div>

                          <div className="team-info">
                            <div className="team-name">{team.teamName || 'Unknown Team'}</div>
                            <div className="team-members">
                              {team.members ? team.members.join(' • ') : 'No members listed'}
                            </div>
                          </div>
                        </div>

                        {(!team.totalSales || team.totalSales === 0) && (!team.orderCount || team.orderCount === 0) ? (
                          <div className="hustle-message">
                            {getHustleMessage()}
                          </div>
                        ) : (
                          <div className="card-stats-row">
                            <div className="stat-box">
                              <div className="stat-icon-label">
                                <span className="stat-icon">💰</span>
                                <span className="stat-label">TOTAL SALES</span>
                              </div>
                              <div className="stat-value">{formatCurrency(team.totalSales || 0)}</div>
                            </div>

                            <div className="stat-box">
                              <div className="stat-icon-label">
                                <span className="stat-icon">📦</span>
                                <span className="stat-label">ORDERS</span>
                              </div>
                              <div className="stat-value">{team.orderCount || 0}</div>
                            </div>

                            <div className="stat-box">
                              <div className="stat-icon-label">
                                <span className="stat-icon">₹</span>
                                <span className="stat-label">AVG ORDER</span>
                              </div>
                              <div className="stat-value">
                                {team.orderCount > 0
                                  ? formatCurrency(team.totalSales / team.orderCount)
                                  : formatCurrency(0)}
                              </div>
                            </div>

                            <div className="status-badge">
                              <span className="status-dot"></span>
                              <span className="status-text">Stable</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recent Transactions Section */}
          <section className="transactions-section">
            {transactions.length > 0 && (
              <div className="transactions-ticker">
                <div className="ticker-content">
                  {/* Duplicate transactions for seamless scroll */}
                  {[...transactions, ...transactions].map((transaction, index) => (
                    <div key={`${transaction.id || index}-${index}`} className="transaction-item">
                      <span className="transaction-icon">💰</span>
                      <span className="transaction-team">{transaction.teamName || 'Unknown'}</span>
                      <span className="transaction-amount">
                        {formatCurrency(transaction.amount || 0)}
                      </span>
                      <span className="transaction-time">
                        {formatTimeAgo(transaction.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

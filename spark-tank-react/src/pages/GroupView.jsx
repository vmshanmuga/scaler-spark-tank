import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLeaderboardData, useTransactionsData, useLastSync } from '../hooks/useFirebaseData';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import DropshippingLoader from '../components/DropshippingLoader';
import './GroupView.css';

export default function GroupView() {
  const { userAccess, isAdmin, getUserGroup } = useAuth();
  const { data: leaderboardData, loading: leaderboardLoading } = useLeaderboardData();
  const { data: transactionsData, loading: transactionsLoading } = useTransactionsData();
  const { data: lastSyncData } = useLastSync();

  const [activeTab, setActiveTab] = useState('leaderboard');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [lastUpdated, setLastUpdated] = useState('--');

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

  // Team color mapping (10 distinct colors)
  const getTeamColorClass = (teamName) => {
    if (!teamName) return 'team-color-0';
    const hash = teamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `team-color-${hash % 10}`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Format number with commas
  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toLocaleString('en-IN');
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    if (trend === 'up') return '📈 Up';
    if (trend === 'down') return '📉 Down';
    return '➖ Stable';
  };

  // Get time ago
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Filter leaderboard data based on user access
  const filteredLeaderboardData = useMemo(() => {
    if (!leaderboardData) return [];

    const dataArray = Array.isArray(leaderboardData)
      ? leaderboardData
      : Object.values(leaderboardData);

    // Filter by group if not admin
    if (!isAdmin()) {
      const userGroup = getUserGroup();
      return dataArray.filter(
        (item) => item.groupName === userGroup || item.Group === userGroup
      );
    }

    return dataArray;
  }, [leaderboardData, isAdmin, getUserGroup]);

  // Get sorted leaderboard
  const sortedLeaderboard = useMemo(() => {
    return [...filteredLeaderboardData].sort((a, b) => (a.rank || 0) - (b.rank || 0));
  }, [filteredLeaderboardData]);

  // Filter transactions data
  const filteredTransactions = useMemo(() => {
    if (!transactionsData) return [];

    let transactions = Array.isArray(transactionsData)
      ? transactionsData
      : Object.values(transactionsData);

    // Filter by group if not admin
    if (!isAdmin()) {
      const userGroup = getUserGroup();
      transactions = transactions.filter(
        (txn) => txn.groupName === userGroup || txn.Group === userGroup
      );
    }

    // Filter by event type
    if (selectedEventType !== 'all') {
      if (selectedEventType === 'status:paid') {
        transactions = transactions.filter((txn) => txn.status === 'paid');
      } else {
        transactions = transactions.filter(
          (txn) => txn.event === selectedEventType || txn.eventType === selectedEventType
        );
      }
    }

    // Filter by team
    if (selectedTeam !== 'all') {
      transactions = transactions.filter(
        (txn) => txn.teamName === selectedTeam || txn['Team Name'] === selectedTeam
      );
    }

    // Sort by timestamp (most recent first)
    return transactions.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.time || 0).getTime();
      const timeB = new Date(b.timestamp || b.time || 0).getTime();
      return timeB - timeA;
    });
  }, [transactionsData, selectedEventType, selectedTeam, isAdmin, getUserGroup]);

  // Get unique teams for dropdown
  const uniqueTeams = useMemo(() => {
    if (!transactionsData) return [];

    const transactions = Array.isArray(transactionsData)
      ? transactionsData
      : Object.values(transactionsData);

    const teams = new Set();
    transactions.forEach((txn) => {
      const teamName = txn.teamName || txn['Team Name'];
      if (teamName) teams.add(teamName);
    });

    return Array.from(teams).sort();
  }, [transactionsData]);

  // Calculate stats
  const stats = useMemo(() => {
    const data = filteredLeaderboardData;

    const totalSales = data.reduce((sum, item) => sum + (item.totalSales || 0), 0);
    const totalOrders = data.reduce((sum, item) => sum + (item.transactionCount || 0), 0);
    const activeTeams = data.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalSales: formatCurrency(totalSales),
      totalOrders: formatNumber(totalOrders),
      activeTeams: activeTeams,
      avgOrderValue: formatCurrency(Math.round(avgOrderValue))
    };
  }, [filteredLeaderboardData]);

  // Event type filters
  const eventFilters = [
    { label: 'All Events', value: 'all' },
    { label: '💰 Paid', value: 'status:paid' },
    { label: '💸 Refund', value: 'refund' },
    { label: 'Authorized', value: 'payment.authorized' },
    { label: 'Captured', value: 'payment.captured' },
    { label: 'Order Paid', value: 'order.paid' },
    { label: 'Link Paid', value: 'payment_link.paid' },
    { label: 'QR Paid', value: 'qr_code.paid' }
  ];

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    if (!status) return 'status-badge';
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid' || statusLower === 'success') return 'status-badge status-paid';
    if (statusLower === 'captured') return 'status-badge status-captured';
    if (statusLower === 'authorized') return 'status-badge status-authorized';
    if (statusLower === 'error' || statusLower === 'failed') return 'status-badge status-error';
    return 'status-badge';
  };

  // Show loader while loading
  if (leaderboardLoading || transactionsLoading) {
    return <DropshippingLoader />;
  }

  // Get user's name and construct welcome message
  const userName = userAccess?.Name || userAccess?.name || 'User';
  const accessType = userAccess?.['Access Type'] || userAccess?.accessType;
  const groupName = userAccess?.['Group Name'] || userAccess?.groupName;

  const welcomeMessage = accessType === 'Admin'
    ? `Welcome, ${userName} - 🔧 Admin`
    : `Welcome, ${userName} - 📚 ${groupName || 'Student'}`;

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-area">
        <Topbar
          breadcrumb={['Home', 'Group View']}
          showLiveDashboard={true}
        />

        {/* Animated Background */}
        <div className="dashboard-bg">
          <div className="bg-orb bg-orb-1"></div>
          <div className="bg-orb bg-orb-2"></div>
          <div className="bg-orb bg-orb-3"></div>
        </div>

        <main className="content-area">
          {/* Stats Cards */}
          <section className="stats-section">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-details">
                <div className="stat-label">Total Sales</div>
                <div className="stat-value">{stats.totalSales}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-details">
                <div className="stat-label">Total Orders</div>
                <div className="stat-value">{stats.totalOrders}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-details">
                <div className="stat-label">Active Teams</div>
                <div className="stat-value">{stats.activeTeams}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-details">
                <div className="stat-label">Avg Order Value</div>
                <div className="stat-value">{stats.avgOrderValue}</div>
              </div>
            </div>
          </section>

          {/* Data Tables Section */}
          <section className="admin-tables-section">
            {/* Tab Toggle */}
            <div className="view-toggle">
              <button
                className={`toggle-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('leaderboard')}
              >
                Leaderboard Data
              </button>
              <button
                className={`toggle-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                onClick={() => setActiveTab('transactions')}
              >
                Recent Transactions
              </button>
            </div>

            {/* Leaderboard View */}
            {activeTab === 'leaderboard' && (
              <div className="admin-view active">
                <div className="admin-card">
                  <div className="card-header-row">
                    <h2 className="card-title">🏆 Leaderboard Data</h2>
                    <div className="live-indicator">
                      <span className="live-dot"></span>
                      <span>LIVE</span>
                      <span>•</span>
                      <span>Last updated: {lastUpdated}</span>
                    </div>
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Team</th>
                          <th>Members</th>
                          <th>Total Sales</th>
                          <th>Orders</th>
                          <th>Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedLeaderboard.length > 0 ? (
                          sortedLeaderboard.map((team, index) => {
                            // Check if team has sales or orders
                            const hasSales = (team.totalSales > 0) || (team.transactionCount > 0);

                            return (
                              <tr key={index}>
                                <td>
                                  {hasSales ? (
                                    <strong>#{team.rank || index + 1}</strong>
                                  ) : (
                                    <span style={{ opacity: 0.5 }}>-</span>
                                  )}
                                </td>
                                <td>
                                  <span className={`team-name ${getTeamColorClass(team.teamName)}`}>
                                    {team.teamName || team['Team Name'] || 'N/A'}
                                  </span>
                                </td>
                                <td>{team.members || team.Members || '-'}</td>
                                <td>
                                  <strong>{formatCurrency(team.totalSales || 0)}</strong>
                                </td>
                                <td>{team.transactionCount || team['Transaction Count'] || 0}</td>
                                <td>{getTrendIcon(team.trend)}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                              No leaderboard data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions View */}
            {activeTab === 'transactions' && (
              <div className="admin-view active">
                <div className="admin-card">
                  <div className="card-header-row">
                    <h2 className="card-title">💳 Recent Transactions</h2>
                    <div className="live-indicator">
                      <span className="live-dot"></span>
                      <span>LIVE</span>
                      <span>•</span>
                      <span>Last updated: {lastUpdated}</span>
                    </div>
                  </div>

                  {/* Team Filter Dropdown */}
                  <div className="filter-row">
                    <label htmlFor="teamFilter" className="filter-label">
                      Filter by Team:
                    </label>
                    <select
                      id="teamFilter"
                      className="team-filter-dropdown"
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                    >
                      <option value="all">All Teams</option>
                      {uniqueTeams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Event Type Filters */}
                  <div className="event-filters">
                    {eventFilters.map((filter) => (
                      <button
                        key={filter.value}
                        className={`event-filter-btn ${
                          selectedEventType === filter.value ? 'active' : ''
                        }`}
                        onClick={() => setSelectedEventType(filter.value)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Team</th>
                          <th>Event Type</th>
                          <th>Amount</th>
                          <th>Payment ID</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.length > 0 ? (
                          filteredTransactions.map((txn, index) => {
                            const teamName = txn.teamName || txn['Team Name'] || 'Unknown';
                            const eventType =
                              txn.event || txn.eventType || txn['Event Type'] || 'N/A';
                            const amount = txn.amount || txn.Amount || 0;
                            const paymentId =
                              txn.paymentId || txn['Payment ID'] || txn.id || '-';
                            const status = txn.status || txn.Status || 'N/A';
                            const timestamp = txn.timestamp || txn.time || txn.Time;

                            return (
                              <tr key={index}>
                                <td>{getTimeAgo(timestamp)}</td>
                                <td>
                                  <span className={`team-name ${getTeamColorClass(teamName)}`}>
                                    {teamName}
                                  </span>
                                </td>
                                <td>
                                  <span className="event-badge">{eventType}</span>
                                </td>
                                <td>
                                  <strong>{formatCurrency(amount)}</strong>
                                </td>
                                <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                  {paymentId}
                                </td>
                                <td>
                                  <span className={getStatusBadgeClass(status)}>{status}</span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                              No transactions available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

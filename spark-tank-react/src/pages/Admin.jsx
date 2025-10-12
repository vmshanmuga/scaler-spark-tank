import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLeaderboardData, useTransactionsData, useMetadata, useLastSync } from '../hooks/useFirebaseData';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import DropshippingLoader from '../components/DropshippingLoader';
import './Admin.css';

export default function Admin() {
  const { isAdmin } = useAuth();
  const { data: leaderboardData, loading: leaderboardLoading } = useLeaderboardData();
  const { data: transactionsData, loading: transactionsLoading } = useTransactionsData();
  const { data: metadata } = useMetadata();
  const { data: lastSyncData } = useLastSync();

  const [timeFilter, setTimeFilter] = useState('all'); // all, today, week, month, custom
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('--');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Update last sync time
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

    updateLastSync();
    const interval = setInterval(updateLastSync, 1000);
    return () => clearInterval(interval);
  }, [lastSyncData]);

  // Convert leaderboard to array
  const leaderboard = useMemo(() => {
    if (!leaderboardData) return [];
    return Array.isArray(leaderboardData)
      ? leaderboardData
      : Object.values(leaderboardData);
  }, [leaderboardData]);

  // Convert transactions to array
  const transactions = useMemo(() => {
    if (!transactionsData) return [];
    return Array.isArray(transactionsData)
      ? transactionsData
      : Object.values(transactionsData);
  }, [transactionsData]);

  // Parse date from various formats (MM/DD/YYYY HH:MM:SS, ISO string, or timestamp)
  const parseRazorpayDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      // Try parsing as ISO string first (standard format)
      const isoDate = new Date(dateStr);
      if (!isNaN(isoDate.getTime())) {
        return isoDate;
      }

      // Try parsing MM/DD/YYYY HH:MM:SS format
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const [datePart, timePart] = dateStr.split(' ');
        const [month, day, year] = datePart.split('/');
        const [hours, minutes, seconds] = timePart ? timePart.split(':') : ['0', '0', '0'];
        return new Date(year, month - 1, day, hours, minutes, seconds);
      }

      return null;
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      return null;
    }
  };

  // Filter transactions by time AND event type (matching backend logic)
  const filteredTransactions = useMemo(() => {
    // First, filter by event type to match backend logic
    // Backend only counts: order.paid and payment_link.paid with status = 'paid'
    const paidOrderTransactions = transactions.filter(txn => {
      const eventType = txn.eventType || txn.event || txn['Event Type'] || '';
      const status = txn.status || txn.Status || '';

      // Match backend logic: only count order.paid and payment_link.paid with status = paid
      return (eventType === 'order.paid' || eventType === 'payment_link.paid') &&
             status === 'paid';
    });

    console.log(`Filtered ${paidOrderTransactions.length} paid orders out of ${transactions.length} total transactions`);

    if (timeFilter === 'all') return paidOrderTransactions;

    // Then filter by date
    const now = new Date();
    const filtered = paidOrderTransactions.filter(txn => {
      // Try multiple field names for timestamp
      const timestampValue = txn.timestamp || txn.time || txn.Timestamp || txn.Time;
      const txnDate = parseRazorpayDate(timestampValue);

      if (!txnDate || isNaN(txnDate.getTime())) {
        return false;
      }

      if (timeFilter === 'today') {
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        return txnDate >= todayStart && txnDate <= todayEnd;
      } else if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        weekAgo.setHours(0, 0, 0, 0);
        return txnDate >= weekAgo && txnDate <= now;
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        monthAgo.setHours(0, 0, 0, 0);
        return txnDate >= monthAgo && txnDate <= now;
      } else if (timeFilter === 'custom') {
        if (!startDate) return true;
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return txnDate >= start && txnDate <= end;
        } else {
          // Single date - show entire day
          const dayEnd = new Date(start);
          dayEnd.setHours(23, 59, 59, 999);
          return txnDate >= start && txnDate <= dayEnd;
        }
      }
      return true;
    });

    console.log(`Filtered ${filtered.length} paid orders for timeFilter: ${timeFilter}`);
    return filtered;
  }, [transactions, timeFilter, startDate, endDate]);

  // Calculate metrics using SAME LOGIC as Home/GroupView (matches backend calculation)
  const metrics = useMemo(() => {
    // All calculations now use filteredTransactions which already applies backend logic:
    // - Only counts order.paid and payment_link.paid events
    // - Only counts transactions with status = 'paid'
    // - For "All Time", filteredTransactions = all paid orders
    // - For other filters, filteredTransactions = paid orders in date range

    const totalSales = filteredTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);
    const totalOrders = filteredTransactions.length;
    const activeTeams = new Set(filteredTransactions.map(txn => txn.teamName)).size;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    // Growth calculation (compare to previous period) - also using paid orders only
    const now = new Date();
    let previousPeriodTxns = [];

    // First, get only paid orders from transactions
    const allPaidOrders = transactions.filter(txn => {
      const eventType = txn.eventType || txn.event || txn['Event Type'] || '';
      const status = txn.status || txn.Status || '';
      return (eventType === 'order.paid' || eventType === 'payment_link.paid') && status === 'paid';
    });

    if (timeFilter === 'today') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      previousPeriodTxns = allPaidOrders.filter(txn => {
        const timestampValue = txn.timestamp || txn.time || txn.Timestamp || txn.Time;
        const txnDate = parseRazorpayDate(timestampValue);
        return txnDate && txnDate >= yesterday && txnDate <= yesterdayEnd;
      });
    } else if (timeFilter === 'week') {
      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      twoWeeksAgo.setHours(0, 0, 0, 0);
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      oneWeekAgo.setHours(0, 0, 0, 0);

      previousPeriodTxns = allPaidOrders.filter(txn => {
        const timestampValue = txn.timestamp || txn.time || txn.Timestamp || txn.Time;
        const txnDate = parseRazorpayDate(timestampValue);
        return txnDate && txnDate >= twoWeeksAgo && txnDate < oneWeekAgo;
      });
    } else if (timeFilter === 'month') {
      const twoMonthsAgo = new Date(now);
      twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
      twoMonthsAgo.setHours(0, 0, 0, 0);
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      oneMonthAgo.setHours(0, 0, 0, 0);

      previousPeriodTxns = allPaidOrders.filter(txn => {
        const timestampValue = txn.timestamp || txn.time || txn.Timestamp || txn.Time;
        const txnDate = parseRazorpayDate(timestampValue);
        return txnDate && txnDate >= twoMonthsAgo && txnDate < oneMonthAgo;
      });
    }

    const previousSales = previousPeriodTxns.reduce((sum, txn) => sum + (txn.amount || 0), 0);
    const growthPercentage = previousSales > 0 ? ((totalSales - previousSales) / previousSales) * 100 : 0;

    console.log(`Growth calculation - Filter: ${timeFilter}, Current: ${totalSales}, Previous: ${previousSales}, Growth: ${growthPercentage.toFixed(1)}%`);

    // Return metrics (all filters now use same calculation logic)
    console.log(`📊 Metrics (${timeFilter} - using PAID ORDERS only):`, {
      totalSales,
      totalOrders,
      activeTeams,
      avgOrderValue,
      growthPercentage: `${growthPercentage.toFixed(1)}%`,
      paidOrdersCount: filteredTransactions.length
    });

    return {
      totalSales,
      totalOrders,
      activeTeams,
      avgOrderValue,
      growthPercentage
    };
  }, [filteredTransactions, transactions, timeFilter]);

  // Team performance analysis - REDESIGNED to show ALL teams with static + filtered columns
  const teamPerformance = useMemo(() => {
    // Start with ALL teams from leaderboard (includes teams with 0 sales)
    const allTeams = leaderboard.map(team => ({
      rank: team.rank,
      teamName: team.teamName || team['Team Name'] || 'Unknown',
      members: Array.isArray(team.members) ? team.members.join(', ') : (team.members || '-'),
      group: team.group || team.Group || '',

      // STATIC columns (all-time data from leaderboard)
      totalSalesAllTime: team.totalSales || 0,
      totalOrdersAllTime: team.transactionCount || team.orderCount || 0,
      avgOrderValueAllTime: team.avgOrderValue || 0,

      // FILTERED columns (will be filled from filteredTransactions)
      periodSales: 0,
      periodOrders: 0,
      periodAvgOrderValue: 0,
      hasPeriodSales: false
    }));

    // Calculate period-specific sales from filtered transactions
    const periodStats = {};
    filteredTransactions.forEach(txn => {
      const teamName = txn.teamName || 'Unknown';
      if (!periodStats[teamName]) {
        periodStats[teamName] = {
          sales: 0,
          orders: 0
        };
      }
      periodStats[teamName].sales += txn.amount || 0;
      periodStats[teamName].orders += 1;
    });

    // Merge period stats into all teams
    allTeams.forEach(team => {
      const periodData = periodStats[team.teamName];
      if (periodData) {
        team.periodSales = periodData.sales;
        team.periodOrders = periodData.orders;
        team.periodAvgOrderValue = periodData.orders > 0 ? Math.round(periodData.sales / periodData.orders) : 0;
        team.hasPeriodSales = true;
      }
    });

    console.log(`📈 Team Performance: ${allTeams.length} total teams, ${Object.keys(periodStats).length} with sales in ${timeFilter} period`);

    // Sort by rank (overall ranking)
    return allTeams.sort((a, b) => a.rank - b.rank);
  }, [leaderboard, filteredTransactions, timeFilter]);

  // Top and bottom performers - based on period sales
  const topPerformers = useMemo(() => {
    const teamsWithSales = teamPerformance.filter(t => t.hasPeriodSales);
    return [...teamsWithSales].sort((a, b) => b.periodSales - a.periodSales).slice(0, 3);
  }, [teamPerformance]);

  const bottomPerformers = useMemo(() => {
    const teamsWithSales = teamPerformance.filter(t => t.hasPeriodSales);
    return [...teamsWithSales].sort((a, b) => a.periodSales - b.periodSales).slice(0, 3);
  }, [teamPerformance]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (leaderboardLoading || transactionsLoading) {
    return <DropshippingLoader />;
  }

  if (!isAdmin()) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-area">
          <Topbar breadcrumb={['Admin', 'Dashboard']} showLiveDashboard={false} />
          <main className="content-area">
            <div className="access-denied">
              <div className="access-denied-icon">🚫</div>
              <h1>Access Denied</h1>
              <p>You don't have permission to access the admin dashboard.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Topbar breadcrumb={['Admin', 'Analytics Dashboard']} showLiveDashboard={false} />

        {/* Animated Background */}
        <div className="dashboard-bg">
          <div className="bg-orb bg-orb-1"></div>
          <div className="bg-orb bg-orb-2"></div>
          <div className="bg-orb bg-orb-3"></div>
        </div>

        <main className="content-area">
          <div className="admin-container">
            {/* Header */}
            <div className="admin-header">
              <div className="admin-header-content">
                <span className="admin-icon">📊</span>
                <div>
                  <h1 className="admin-title">Analytics Dashboard</h1>
                  <p className="admin-subtitle">Track team performance and competition metrics</p>
                </div>
              </div>
              <div className="live-indicator">
                <span className="live-dot"></span>
                <span>LIVE</span>
                <span>•</span>
                <span>Last updated: {lastUpdated}</span>
              </div>
            </div>

            {/* Time Filter */}
            <div className="time-filter-section">
              <div className="filter-label">Time Period:</div>
              <div className="time-filter-buttons">
                <button
                  className={`filter-btn ${timeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setTimeFilter('all');
                    setShowDatePicker(false);
                  }}
                >
                  All Time
                </button>
                <button
                  className={`filter-btn ${timeFilter === 'today' ? 'active' : ''}`}
                  onClick={() => {
                    setTimeFilter('today');
                    setShowDatePicker(false);
                  }}
                >
                  Today
                </button>
                <button
                  className={`filter-btn ${timeFilter === 'week' ? 'active' : ''}`}
                  onClick={() => {
                    setTimeFilter('week');
                    setShowDatePicker(false);
                  }}
                >
                  Last 7 Days
                </button>
                <button
                  className={`filter-btn ${timeFilter === 'month' ? 'active' : ''}`}
                  onClick={() => {
                    setTimeFilter('month');
                    setShowDatePicker(false);
                  }}
                >
                  Last 30 Days
                </button>
                <button
                  className={`filter-btn ${timeFilter === 'custom' ? 'active' : ''}`}
                  onClick={() => {
                    setTimeFilter('custom');
                    setShowDatePicker(true);
                  }}
                >
                  📅 Custom Date
                </button>
              </div>

              {/* Date Picker - Shows when Custom Date is selected */}
              {showDatePicker && (
                <div className="date-picker-container">
                  <div className="date-input-group">
                    <label htmlFor="startDate" className="date-label">
                      Start Date:
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      className="date-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="date-input-group">
                    <label htmlFor="endDate" className="date-label">
                      End Date (Optional):
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      className="date-input"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                    />
                  </div>
                  {startDate && !endDate && (
                    <div className="date-picker-hint">
                      💡 Showing data for {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                  {startDate && endDate && (
                    <div className="date-picker-hint">
                      💡 Showing data from {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Overview Metrics */}
            <div className="metrics-grid">
              {/* Total Sales = Sum of all team's totalSales from leaderboard */}
              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-icon">💰</span>
                  <span className="metric-label">Total Sales</span>
                </div>
                <div className="metric-value">{formatCurrency(metrics.totalSales)}</div>
                <div className={`metric-change ${metrics.growthPercentage >= 0 ? 'positive' : 'negative'}`}>
                  <span className="change-icon">{metrics.growthPercentage >= 0 ? '↑' : '↓'}</span>
                  <span>{formatPercentage(metrics.growthPercentage)} vs previous period</span>
                </div>
              </div>

              {/* Total Orders = Count of paid orders (order.paid + payment_link.paid) */}
              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-icon">📦</span>
                  <span className="metric-label">Total Orders</span>
                </div>
                <div className="metric-value">{metrics.totalOrders}</div>
                <div className="metric-info">
                  paid orders only
                </div>
              </div>

              {/* Active Teams = Count of teams with sales in period */}
              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-icon">👥</span>
                  <span className="metric-label">Active Teams</span>
                </div>
                <div className="metric-value">{metrics.activeTeams}</div>
                <div className="metric-info">
                  teams with sales
                </div>
              </div>

              {/* Avg Order Value = Total Sales / Total Orders */}
              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-icon">📈</span>
                  <span className="metric-label">Avg Order Value</span>
                </div>
                <div className="metric-value">{formatCurrency(metrics.avgOrderValue)}</div>
                <div className="metric-info">
                  = Total Sales ÷ Total Orders
                </div>
              </div>
            </div>

            {/* Performance Analysis */}
            <div className="analysis-grid">
              {/* Top Performers */}
              <div className="analysis-card">
                <div className="card-header-section">
                  <h2 className="card-title">🏆 Top Performers</h2>
                  <span className="card-subtitle">Leading teams</span>
                </div>
                <div className="performers-list">
                  {topPerformers.length > 0 ? (
                    topPerformers.map((team, index) => (
                      <div key={team.teamName} className="performer-item top-performer">
                        <div className="performer-rank">#{index + 1}</div>
                        <div className="performer-info">
                          <div className="performer-name">{team.teamName}</div>
                          <div className="performer-stats">
                            {team.periodOrders} orders • {formatCurrency(team.periodAvgOrderValue)} avg
                          </div>
                        </div>
                        <div className="performer-value">{formatCurrency(team.periodSales)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-small">No sales in this period</div>
                  )}
                </div>
              </div>

              {/* Bottom Performers */}
              <div className="analysis-card">
                <div className="card-header-section">
                  <h2 className="card-title">⚠️ Needs Attention</h2>
                  <span className="card-subtitle">Teams needing support</span>
                </div>
                <div className="performers-list">
                  {bottomPerformers.length > 0 ? (
                    bottomPerformers.map((team, index) => (
                      <div key={team.teamName} className="performer-item bottom-performer">
                        <div className="performer-rank">#{team.rank}</div>
                        <div className="performer-info">
                          <div className="performer-name">{team.teamName}</div>
                          <div className="performer-stats">
                            {team.periodOrders} orders • {formatCurrency(team.periodAvgOrderValue)} avg
                          </div>
                        </div>
                        <div className="performer-value">{formatCurrency(team.periodSales)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-small">No sales in this period</div>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Team Performance Table */}
            <div className="performance-table-card">
              <div className="card-header-section">
                <div>
                  <h2 className="card-title">📋 Detailed Team Performance</h2>
                  <span className="card-subtitle">Comprehensive breakdown of all teams</span>
                </div>
              </div>

              <div className="table-container">
                <table className="performance-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Team Name</th>
                      <th>Members</th>
                      <th className="static-col">Total Sales<br/><span style={{fontSize: '0.75rem', fontWeight: 400, opacity: 0.7}}>(All Time)</span></th>
                      <th className="static-col">Total Orders<br/><span style={{fontSize: '0.75rem', fontWeight: 400, opacity: 0.7}}>(All Time)</span></th>
                      <th className="filtered-col">Period Sales<br/><span style={{fontSize: '0.75rem', fontWeight: 400, opacity: 0.7}}>({timeFilter === 'all' ? 'All Time' : timeFilter === 'today' ? 'Today' : timeFilter === 'week' ? 'Last 7 Days' : timeFilter === 'month' ? 'Last 30 Days' : 'Custom'})</span></th>
                      <th className="filtered-col">Period Orders<br/><span style={{fontSize: '0.75rem', fontWeight: 400, opacity: 0.7}}>({timeFilter === 'all' ? 'All Time' : timeFilter === 'today' ? 'Today' : timeFilter === 'week' ? 'Last 7 Days' : timeFilter === 'month' ? 'Last 30 Days' : 'Custom'})</span></th>
                      <th className="filtered-col">Avg Order<br/><span style={{fontSize: '0.75rem', fontWeight: 400, opacity: 0.7}}>(Period)</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPerformance.length > 0 ? (
                      teamPerformance.map((team) => {
                        return (
                          <tr key={team.teamName} className={!team.hasPeriodSales ? 'no-period-sales' : ''}>
                            <td>
                              <div className="rank-badge">#{team.rank}</div>
                            </td>
                            <td>
                              <div className="team-name-cell">{team.teamName}</div>
                            </td>
                            <td>
                              <div className="members-cell">{team.members}</div>
                            </td>
                            <td className="static-col">
                              <div className="sales-value">{formatCurrency(team.totalSalesAllTime)}</div>
                            </td>
                            <td className="static-col">{team.totalOrdersAllTime}</td>
                            <td className="filtered-col">
                              {team.hasPeriodSales ? (
                                <div className="sales-value">{formatCurrency(team.periodSales)}</div>
                              ) : (
                                <span className="no-sales-badge">No sales</span>
                              )}
                            </td>
                            <td className="filtered-col">
                              {team.hasPeriodSales ? team.periodOrders : '-'}
                            </td>
                            <td className="filtered-col">
                              {team.hasPeriodSales ? formatCurrency(team.periodAvgOrderValue) : '-'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="empty-state-table">
                          No team data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

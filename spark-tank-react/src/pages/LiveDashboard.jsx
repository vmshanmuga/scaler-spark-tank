import React, { useState, useEffect } from 'react';
import { useLeaderboardData, useMetadata } from '../hooks/useFirebaseData';
import DropshippingLoader from '../components/DropshippingLoader';
import './LiveDashboard.css';

export default function LiveDashboard() {
  const { data: leaderboardData, loading: leaderboardLoading } = useLeaderboardData();
  const { data: metadata, loading: metadataLoading } = useMetadata();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [animatedNumbers, setAnimatedNumbers] = useState({});

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Update last updated time when data changes
  useEffect(() => {
    if (leaderboardData) {
      setLastUpdated(new Date());
    }
  }, [leaderboardData]);

  // Animate numbers counting up
  const animateNumber = (targetValue, key) => {
    const duration = 1000;
    const steps = 30;
    const increment = targetValue / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        setAnimatedNumbers(prev => ({ ...prev, [key]: targetValue }));
        clearInterval(interval);
      } else {
        setAnimatedNumbers(prev => ({ ...prev, [key]: Math.floor(current) }));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  };

  // Initialize animated numbers when data loads
  useEffect(() => {
    if (leaderboardData && Array.isArray(leaderboardData)) {
      leaderboardData.forEach((team, index) => {
        if (team && typeof team.totalSales === 'number') {
          animateNumber(team.totalSales, `sales-${index}`);
          animateNumber(team.orderCount || 0, `orders-${index}`);
        }
      });
    }
  }, [leaderboardData]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  // Format time
  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  // Calculate stats
  const calculateStats = () => {
    if (!leaderboardData || !Array.isArray(leaderboardData)) {
      return { totalSales: 0, totalOrders: 0, activeTeams: 0 };
    }

    const totalSales = leaderboardData.reduce((sum, team) => sum + (team?.totalSales || 0), 0);
    const totalOrders = leaderboardData.reduce((sum, team) => sum + (team?.orderCount || 0), 0);
    const activeTeams = leaderboardData.filter(team => team && team.totalSales > 0).length;

    return { totalSales, totalOrders, activeTeams };
  };

  // Get medal icon
  const getMedalIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  // Get rank class
  const getRankClass = (rank) => {
    switch (rank) {
      case 1:
        return 'gold';
      case 2:
        return 'silver';
      case 3:
        return 'bronze';
      default:
        return '';
    }
  };

  const loading = leaderboardLoading || metadataLoading;
  const stats = calculateStats();
  const teamsArray = Array.isArray(leaderboardData) ? leaderboardData : [];
  const topThree = teamsArray.slice(0, 3);
  const remaining = teamsArray.slice(3);

  if (loading) {
    return <DropshippingLoader />;
  }

  return (
    <div className="live-dashboard">
      {/* Animated Background */}
      <div className="live-dashboard-bg">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>

      {/* Main Content */}
      <div className="live-dashboard-content">
        {/* Header Section */}
        <header className="live-dashboard-header">
          <h1 className="live-dashboard-title">SPARK TANK 2025</h1>
          <p className="live-dashboard-subtitle">Live Dropshipping Competition Leaderboard</p>
          <div className="live-dashboard-status">
            <span className="live-dot"></span>
            <span className="live-text">LIVE</span>
            <span className="live-separator">•</span>
            <span className="live-updated">Last updated: {formatTime(lastUpdated)}</span>
          </div>
        </header>

        {/* Stats Bar */}
        <div className="live-dashboard-stats">
          <div className="stat-card stat-card-primary">
            <div className="stat-label">Total Sales</div>
            <div className="stat-value stat-value-large">{formatCurrency(stats.totalSales)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{stats.totalOrders}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Teams</div>
            <div className="stat-value">{stats.activeTeams}</div>
          </div>
        </div>

        {/* Top 3 Spotlight */}
        {topThree.length > 0 && (
          <div className="live-dashboard-podium">
            <h2 className="podium-title">Top Performers</h2>
            <div className="podium-cards">
              {topThree.map((team, index) => {
                const rank = index + 1;
                const medal = getMedalIcon(rank);
                const rankClass = getRankClass(rank);

                return (
                  <div key={team.teamId || index} className={`podium-card podium-card-${rankClass}`}>
                    <div className="podium-rank">
                      <span className="podium-medal">{medal}</span>
                      <span className="podium-rank-number">#{rank}</span>
                    </div>
                    <div className="podium-team-name">{team.teamName || 'Unknown Team'}</div>
                    <div className="podium-sales">
                      {formatCurrency(animatedNumbers[`sales-${index}`] || team.totalSales)}
                    </div>
                    <div className="podium-orders">
                      {animatedNumbers[`orders-${index}`] || team.orderCount || 0} orders
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Remaining Teams Grid */}
        {remaining.length > 0 && (
          <div className="live-dashboard-grid">
            <h2 className="grid-title">All Teams</h2>
            <div className="leaderboard-grid">
              {remaining.map((team, index) => {
                const rank = index + 4;
                const dataIndex = index + 3;

                return (
                  <div key={team.teamId || index} className="leaderboard-card">
                    <div className="leaderboard-rank">#{rank}</div>
                    <div className="leaderboard-team-info">
                      <div className="leaderboard-team-name">{team.teamName || 'Unknown Team'}</div>
                      <div className="leaderboard-sales">
                        {formatCurrency(animatedNumbers[`sales-${dataIndex}`] || team.totalSales)}
                      </div>
                      <div className="leaderboard-orders">
                        {animatedNumbers[`orders-${dataIndex}`] || team.orderCount || 0} orders
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {teamsArray.length === 0 && (
          <div className="live-dashboard-empty">
            <div className="empty-icon">📊</div>
            <h2>No Data Available</h2>
            <p>The leaderboard will appear once sales data is synced.</p>
          </div>
        )}
      </div>
    </div>
  );
}

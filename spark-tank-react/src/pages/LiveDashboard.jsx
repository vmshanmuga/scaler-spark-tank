import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLeaderboardData, useTransactionsData, useMetadata, useLastSync } from '../hooks/useFirebaseData';
import DropshippingLoader from '../components/DropshippingLoader';
import LiveDropshippingBg from '../components/LiveDropshippingBg';
import './LiveDashboard.css';

// Confetti Component
const Confetti = ({ pieces, duration }) => {
  const confettiColors = ['#1d8f5b', '#ffc300', '#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

  return (
    <div className="confetti-container">
      {Array.from({ length: pieces }).map((_, index) => (
        <div
          key={index}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
            animationDelay: `${Math.random() * 0.3}s`,
            animationDuration: `${duration / 1000}s`,
          }}
        />
      ))}
    </div>
  );
};

// Small Celebration Component
const SmallCelebration = ({ transaction, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="celebration small-celebration">
      <div className="celebration-flash small-flash" />
      <Confetti pieces={30} duration={1500} />
      <div className="celebration-toast">
        <div className="toast-icon">💰</div>
        <div className="toast-content">
          <div className="toast-team">{transaction.teamName}</div>
          <div className="toast-amount">{formatCurrency(transaction.amount)}</div>
        </div>
      </div>
    </div>
  );
};

// Big Celebration Component
const BigCelebration = ({ transaction, onComplete }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);

    // Animate count up
    const duration = 1000;
    const steps = 30;
    const increment = transaction.amount / steps;
    let current = 0;

    const countInterval = setInterval(() => {
      current += increment;
      if (current >= transaction.amount) {
        setCount(transaction.amount);
        clearInterval(countInterval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => {
      clearTimeout(timer);
      clearInterval(countInterval);
    };
  }, [transaction.amount, onComplete]);

  return (
    <div className="celebration big-celebration">
      <div className="celebration-flash big-flash" />
      <Confetti pieces={150} duration={3000} />
      <div className="celebration-modal">
        <div className="celebration-icon">🎉</div>
        <div className="celebration-title">BIG SALE!</div>
        <div className="celebration-team-name">{transaction.teamName}</div>
        <div className="celebration-amount">{formatCurrency(count)}</div>
        <div className="celebration-message">Congratulations on the sale!</div>
      </div>
    </div>
  );
};

// Helper function for currency formatting
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

// Helper function for time ago
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

export default function LiveDashboard() {
  const { data: leaderboardData, loading: leaderboardLoading } = useLeaderboardData();
  const { data: transactionsData, loading: transactionsLoading } = useTransactionsData();
  const { data: metadata } = useMetadata();
  const { data: lastSyncData } = useLastSync();

  const [lastSeenPaymentId, setLastSeenPaymentId] = useState(null);
  const [celebrationQueue, setCelebrationQueue] = useState([]);
  const [currentCelebration, setCurrentCelebration] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('--');
  const [animatedTotalSales, setAnimatedTotalSales] = useState(0);
  const [theme, setTheme] = useState('dark');
  const celebrationTimeoutRef = useRef(null);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('live-dashboard-theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-live-theme', savedTheme);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-live-theme', newTheme);
    localStorage.setItem('live-dashboard-theme', newTheme);
  };

  // Filter paid transactions only (CRITICAL BUSINESS LOGIC)
  const paidTransactions = useMemo(() => {
    if (!transactionsData) return [];

    const transactions = Array.isArray(transactionsData)
      ? transactionsData
      : Object.values(transactionsData);

    // ONLY count order.paid and payment_link.paid with status = 'paid'
    return transactions.filter(txn => {
      const eventType = txn.eventType || txn.event || txn['Event Type'] || '';
      const status = txn.status || txn.Status || '';

      const validEventType = (eventType === 'order.paid' || eventType === 'payment_link.paid');
      const validStatus = (status === 'paid');

      return validEventType && validStatus;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [transactionsData]);

  // Calculate total sales from paid transactions
  const totalSales = useMemo(() => {
    return paidTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);
  }, [paidTransactions]);

  // Calculate stats
  const stats = useMemo(() => {
    const leaderboard = Array.isArray(leaderboardData) ? leaderboardData : [];
    const totalOrders = paidTransactions.length;
    const activeTeams = new Set(paidTransactions.map(t => t.teamName)).size;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    return {
      totalSales,
      totalOrders,
      activeTeams,
      avgOrderValue
    };
  }, [leaderboardData, paidTransactions, totalSales]);

  // Animate total sales counter
  useEffect(() => {
    const target = stats.totalSales;
    const duration = 2000;
    const steps = 60;
    const increment = (target - animatedTotalSales) / steps;
    let current = animatedTotalSales;

    if (Math.abs(target - animatedTotalSales) < 10) {
      setAnimatedTotalSales(target);
      return;
    }

    const interval = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
        setAnimatedTotalSales(target);
        clearInterval(interval);
      } else {
        setAnimatedTotalSales(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [stats.totalSales]);

  // Detect new transactions
  useEffect(() => {
    if (paidTransactions.length > 0) {
      const latestTxn = paidTransactions[0];

      // Check if this is a new transaction we haven't seen
      if (lastSeenPaymentId && latestTxn.paymentId !== lastSeenPaymentId) {
        setCelebrationQueue(prev => [...prev, latestTxn]);
      }

      setLastSeenPaymentId(latestTxn.paymentId);
    }
  }, [paidTransactions, lastSeenPaymentId]);

  // Process celebration queue
  useEffect(() => {
    if (celebrationQueue.length > 0 && !currentCelebration) {
      const nextCelebration = celebrationQueue[0];
      setCurrentCelebration(nextCelebration);
      setCelebrationQueue(prev => prev.slice(1));
    }
  }, [celebrationQueue, currentCelebration]);

  // Handle celebration complete
  const handleCelebrationComplete = useCallback(() => {
    setCurrentCelebration(null);
  }, []);

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
        } else {
          setLastUpdated(date.toLocaleTimeString());
        }
      }
    };

    updateLastSync();
    const interval = setInterval(updateLastSync, 1000);
    return () => clearInterval(interval);
  }, [lastSyncData]);

  // Leaderboard teams - separate teams with sales vs no sales
  const leaderboard = useMemo(() => {
    const teams = Array.isArray(leaderboardData) ? leaderboardData : [];

    // Filter teams with sales/orders
    const teamsWithSales = teams.filter(
      team => (team.totalSales > 0) || (team.transactionCount > 0) || (team.orderCount > 0)
    ).sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));

    // Filter teams without any sales
    const teamsWithoutSales = teams.filter(
      team => (!team.totalSales || team.totalSales === 0) &&
              (!team.transactionCount || team.transactionCount === 0) &&
              (!team.orderCount || team.orderCount === 0)
    );

    return { teamsWithSales, teamsWithoutSales, all: [...teamsWithSales, ...teamsWithoutSales] };
  }, [leaderboardData]);

  const topThree = leaderboard.teamsWithSales.slice(0, 3);
  const remaining = leaderboard.teamsWithSales.slice(3);
  const unrankedTeams = leaderboard.teamsWithoutSales;

  // Get recent 20 transactions for feed
  const recentTransactions = paidTransactions.slice(0, 20);

  // Medal icons
  const getMedalIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const getRankClass = (rank) => {
    switch (rank) {
      case 1: return 'gold';
      case 2: return 'silver';
      case 3: return 'bronze';
      default: return '';
    }
  };

  if (leaderboardLoading || transactionsLoading) {
    return <DropshippingLoader />;
  }

  return (
    <div className="live-dashboard">
      {/* Celebration Overlay */}
      {currentCelebration && (
        currentCelebration.amount >= 1000 ? (
          <BigCelebration
            transaction={currentCelebration}
            onComplete={handleCelebrationComplete}
          />
        ) : (
          <SmallCelebration
            transaction={currentCelebration}
            onComplete={handleCelebrationComplete}
          />
        )
      )}

      {/* Animated Dropshipping Background */}
      <LiveDropshippingBg theme={theme} />

      {/* Animated Background */}
      <div className="live-dashboard-bg">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>

      {/* Main Content */}
      <div className="live-dashboard-content">
        {/* Header */}
        <header className="live-dashboard-header">
          <img
            src="https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/090/511/original/Copy_of_Logo-White.png?1727164234"
            alt="Scaler Logo"
            className="live-dashboard-logo"
          />
          <button
            className="theme-toggle-live"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="theme-icon-live">{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
          <h1 className="live-dashboard-title">SPARK TANK 2025</h1>
          <p className="live-dashboard-subtitle">Live Dropshipping Competition</p>
          <div className="live-dashboard-status">
            <span className="live-dot"></span>
            <span className="live-text">LIVE</span>
            <span className="live-separator">•</span>
            <span className="live-updated">Last updated: {lastUpdated}</span>
          </div>
        </header>

        {/* Total Revenue Card (Hero Section) */}
        <div className="total-revenue-card">
          <div className="revenue-icon">💰</div>
          <div className="revenue-label">TOTAL REVENUE GENERATED</div>
          <div className="revenue-value">{formatCurrency(animatedTotalSales)}</div>
          <div className="revenue-stats">
            <div className="revenue-stat">
              <span className="revenue-stat-icon">📦</span>
              <span className="revenue-stat-value">{stats.totalOrders} Orders</span>
            </div>
            <div className="revenue-stat-divider">|</div>
            <div className="revenue-stat">
              <span className="revenue-stat-icon">👥</span>
              <span className="revenue-stat-value">{stats.activeTeams} Teams</span>
            </div>
            <div className="revenue-stat-divider">|</div>
            <div className="revenue-stat">
              <span className="revenue-stat-icon">📈</span>
              <span className="revenue-stat-value">{formatCurrency(stats.avgOrderValue)} Avg</span>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="live-dashboard-podium">
            <h2 className="podium-title">🏆 Top Performers</h2>
            <div className="podium-cards">
              {topThree.map((team, index) => {
                const rank = index + 1;
                const medal = getMedalIcon(rank);
                const rankClass = getRankClass(rank);

                return (
                  <div key={team.teamName || index} className={`podium-card podium-card-${rankClass}`}>
                    <div className="podium-rank">
                      <span className="podium-medal">{medal}</span>
                      <span className="podium-rank-number">#{rank}</span>
                    </div>
                    <div className="podium-team-name">{team.teamName || 'Unknown Team'}</div>
                    <div className="podium-sales">
                      {formatCurrency(team.totalSales || 0)}
                    </div>
                    <div className="podium-orders">
                      {team.transactionCount || team.orderCount || 0} orders
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Transactions Feed */}
        {recentTransactions.length > 0 && (
          <div className="transaction-feed-section">
            <h2 className="feed-title">💰 LIVE TRANSACTIONS</h2>
            <div className="transaction-feed">
              {recentTransactions.map((txn, index) => (
                <div key={txn.paymentId || index} className="transaction-item">
                  <div className="transaction-icon">🎉</div>
                  <div className="transaction-team">{txn.teamName}</div>
                  <div className="transaction-amount">{formatCurrency(txn.amount)}</div>
                  <div className="transaction-time">{getTimeAgo(txn.timestamp)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Teams Grid */}
        {remaining.length > 0 && (
          <div className="live-dashboard-grid">
            <h2 className="grid-title">All Teams</h2>
            <div className="leaderboard-grid">
              {remaining.map((team, index) => {
                const rank = index + 4;

                return (
                  <div key={team.teamName || index} className="leaderboard-card">
                    <div className="leaderboard-rank">#{rank}</div>
                    <div className="leaderboard-team-info">
                      <div className="leaderboard-team-name">{team.teamName || 'Unknown Team'}</div>
                      <div className="leaderboard-sales">
                        {formatCurrency(team.totalSales || 0)}
                      </div>
                      <div className="leaderboard-orders">
                        {team.transactionCount || team.orderCount || 0} orders
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Unranked Teams */}
        {unrankedTeams.length > 0 && (
          <div className="live-dashboard-grid">
            <h2 className="grid-title">⏳ Teams Yet to Make Their First Sale</h2>
            <div className="leaderboard-grid">
              {unrankedTeams.map((team, index) => (
                <div key={team.teamName || index} className="leaderboard-card" style={{ opacity: 0.7 }}>
                  <div className="leaderboard-rank" style={{ fontSize: '1.5rem' }}>➖</div>
                  <div className="leaderboard-team-info">
                    <div className="leaderboard-team-name">{team.teamName || 'Unknown Team'}</div>
                    <div className="leaderboard-sales">
                      {formatCurrency(0)}
                    </div>
                    <div className="leaderboard-orders" style={{ fontStyle: 'italic' }}>
                      Ready to start!
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {leaderboard.all.length === 0 && (
          <div className="live-dashboard-empty">
            <div className="empty-icon">🏆</div>
            <h2>Competition Starting Soon</h2>
            <p>The leaderboard will appear once teams start making sales.</p>
          </div>
        )}
      </div>

      {/* Transaction Ticker at Bottom */}
      {paidTransactions.length > 0 && (
        <div className="transaction-ticker">
          <div className="ticker-content">
            {/* Duplicate for seamless loop */}
            {[...paidTransactions.slice(0, 20), ...paidTransactions.slice(0, 20)].map((txn, index) => (
              <div key={`${txn.paymentId}-${index}`} className="ticker-item">
                <span className="ticker-icon">💰</span>
                <span className="ticker-team">{txn.teamName}</span>
                <span className="ticker-amount">{formatCurrency(txn.amount)}</span>
                <span className="ticker-time">{getTimeAgo(txn.timestamp)}</span>
                <span className="ticker-separator">|</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Settings Page JavaScript

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwsQOwiJp9Wv-QVPB_9GWGz2mf4a-L2ibrdEisFIaO8fh8lADq3C2sKd9EnWmonXR3B/exec';

function initSettings() {
  console.log('Initializing settings page...');

  // Listen to last sync time
  database.ref('sparkTank/lastSync').on('value', (snapshot) => {
    const timestamp = snapshot.val();
    updateLastSyncDisplay(timestamp);
  });

  // Listen to metadata for system info
  database.ref('sparkTank/metadata').on('value', (snapshot) => {
    const metadata = snapshot.val();
    updateSystemInfo(metadata);
  });

  // Also listen to leaderboard to calculate stats if metadata not available
  database.ref('sparkTank/leaderboard').on('value', (snapshot) => {
    const leaderboard = snapshot.val();
    if (leaderboard) {
      calculateAndDisplayStats(leaderboard);
    }
  });

  // Monitor database connection
  database.ref('.info/connected').on('value', (snapshot) => {
    const connected = snapshot.val();
    updateDatabaseStatus(connected);
  });

  // Manual Sync Button
  const manualSyncBtn = document.getElementById('manualSyncBtn');
  manualSyncBtn?.addEventListener('click', handleManualSync);

  // Export CSV Button
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  exportCsvBtn?.addEventListener('click', exportToCSV);

  // Refresh Data Button
  const refreshDataBtn = document.getElementById('refreshDataBtn');
  refreshDataBtn?.addEventListener('click', refreshDashboardData);

  // Clear Cache Button
  const clearCacheBtn = document.getElementById('clearCacheBtn');
  clearCacheBtn?.addEventListener('click', clearBrowserCache);

  // View Logs Button
  const viewLogsBtn = document.getElementById('viewLogsBtn');
  viewLogsBtn?.addEventListener('click', viewSyncLogs);

  // Theme Toggle
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  themeToggleBtn?.addEventListener('click', toggleThemePreference);

  // Celebration Toggle
  const celebrationToggleBtn = document.getElementById('celebrationToggleBtn');
  celebrationToggleBtn?.addEventListener('click', () => togglePreference('celebrations'));

  // Notification Toggle
  const notificationToggleBtn = document.getElementById('notificationToggleBtn');
  notificationToggleBtn?.addEventListener('click', () => togglePreference('notifications'));

  // Load preferences
  loadPreferences();
}

// Update last sync display
function updateLastSyncDisplay(timestamp) {
  const lastSyncEl = document.getElementById('lastSyncTime');
  if (!lastSyncEl) return;

  if (timestamp) {
    const timeAgo = getTimeAgo(new Date(timestamp));
    lastSyncEl.textContent = timeAgo;
  } else {
    lastSyncEl.textContent = 'Never';
  }

  // Update every second
  setInterval(() => {
    if (timestamp) {
      const timeAgo = getTimeAgo(new Date(timestamp));
      lastSyncEl.textContent = timeAgo;
    }
  }, 1000);
}

// Update system info from metadata
function updateSystemInfo(metadata) {
  if (!metadata) return;

  const totalSalesEl = document.getElementById('systemTotalSales');
  const totalOrdersEl = document.getElementById('systemTotalOrders');
  const activeTeamsEl = document.getElementById('systemActiveTeams');

  if (totalSalesEl) totalSalesEl.textContent = '₹' + formatNumber(metadata.totalSales || 0);
  if (totalOrdersEl) totalOrdersEl.textContent = formatNumber(metadata.totalOrders || 0);
  if (activeTeamsEl) activeTeamsEl.textContent = metadata.activeTeams || 0;
}

// Calculate stats from leaderboard
function calculateAndDisplayStats(leaderboard) {
  let leaderboardArray = Array.isArray(leaderboard) ? leaderboard : Object.values(leaderboard);

  let totalSales = 0;
  let totalOrders = 0;

  leaderboardArray.forEach(team => {
    totalSales += team.totalSales || 0;
    totalOrders += team.transactionCount || 0;
  });

  const totalSalesEl = document.getElementById('systemTotalSales');
  const totalOrdersEl = document.getElementById('systemTotalOrders');
  const activeTeamsEl = document.getElementById('systemActiveTeams');

  if (totalSalesEl) totalSalesEl.textContent = '₹' + formatNumber(totalSales);
  if (totalOrdersEl) totalOrdersEl.textContent = formatNumber(totalOrders);
  if (activeTeamsEl) activeTeamsEl.textContent = leaderboardArray.length;
}

// Update database connection status
function updateDatabaseStatus(connected) {
  const dbStatusEl = document.getElementById('dbStatus');
  if (!dbStatusEl) return;

  if (connected) {
    dbStatusEl.innerHTML = '<span class="status-indicator status-active"></span> Connected';
  } else {
    dbStatusEl.innerHTML = '<span class="status-indicator" style="background: #EF4444;"></span> Disconnected';
  }
}

// Handle manual sync
async function handleManualSync() {
  const btn = document.getElementById('manualSyncBtn');
  const originalText = btn.querySelector('.btn-text').textContent;

  try {
    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = 'Syncing...';
    btn.querySelector('.btn-icon').textContent = '⏳';

    const response = await fetch(WEB_APP_URL + '?action=sync', {
      method: 'POST',
      mode: 'no-cors'
    });

    showNotification('Sync initiated! Data will update shortly.', 'success');

    setTimeout(() => {
      btn.disabled = false;
      btn.querySelector('.btn-text').textContent = originalText;
      btn.querySelector('.btn-icon').textContent = '🔄';
    }, 3000);

  } catch (error) {
    console.error('Sync error:', error);
    showNotification('Sync request sent. Please wait for updates.', 'info');

    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = originalText;
    btn.querySelector('.btn-icon').textContent = '🔄';
  }
}

// Export to CSV
async function exportToCSV() {
  try {
    const snapshot = await database.ref('sparkTank/leaderboard').once('value');
    const leaderboard = snapshot.val();

    if (!leaderboard) {
      showNotification('No data available to export', 'error');
      return;
    }

    let leaderboardArray = Array.isArray(leaderboard) ? leaderboard : Object.values(leaderboard);
    leaderboardArray.sort((a, b) => a.rank - b.rank);

    let csv = 'Rank,Team Name,Group,Total Sales (₹),Orders,Avg Order Value (₹),Trend\n';

    leaderboardArray.forEach(team => {
      csv += `${team.rank},"${team.teamName}","${team.group || ''}",${team.totalSales},${team.transactionCount || 0},${team.avgOrderValue || 0},"${team.trend || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spark-tank-leaderboard-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showNotification('Leaderboard exported successfully!', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showNotification('Failed to export data', 'error');
  }
}

// Refresh dashboard data
function refreshDashboardData() {
  showNotification('Refreshing dashboard data...', 'info');

  // Reload the page data
  window.location.reload();
}

// Clear browser cache
function clearBrowserCache() {
  if (confirm('This will clear all cached data and reload the page. Continue?')) {
    localStorage.clear();
    sessionStorage.clear();

    // Clear service worker cache if exists
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    showNotification('Cache cleared! Reloading...', 'success');

    setTimeout(() => {
      window.location.reload(true);
    }, 1000);
  }
}

// View sync logs
async function viewSyncLogs() {
  try {
    const snapshot = await database.ref('sparkTank/lastSync').once('value');
    const lastSync = snapshot.val();

    const logMessage = `
Last Sync: ${lastSync ? new Date(lastSync).toLocaleString() : 'Never'}

Sync runs automatically every 5 minutes via Google Apps Script.

To view detailed logs:
1. Open Google Sheets
2. Go to Extensions → Apps Script
3. Click on "Executions" in the left sidebar
    `.trim();

    alert(logMessage);
  } catch (error) {
    showNotification('Could not retrieve sync logs', 'error');
  }
}

// Toggle theme preference
function toggleThemePreference() {
  const btn = document.getElementById('themeToggleBtn');
  const text = document.getElementById('themeText');

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);

  text.textContent = newTheme === 'light' ? 'Light Mode' : 'Dark Mode';
  btn.classList.toggle('active', newTheme === 'dark');

  // Also update the topbar theme toggle icon
  const topbarThemeBtn = document.getElementById('themeToggle');
  if (topbarThemeBtn) {
    const themeIcon = topbarThemeBtn.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = newTheme === 'light' ? '☀️' : '🌙';
    }
  }

  showNotification(`Switched to ${newTheme} mode`, 'success');
}

// Toggle preference (celebrations, notifications)
function togglePreference(type) {
  const btn = document.getElementById(type === 'celebrations' ? 'celebrationToggleBtn' : 'notificationToggleBtn');
  const isEnabled = btn.classList.toggle('active');

  btn.querySelector('.toggle-text').textContent = isEnabled ? 'Enabled' : 'Disabled';
  localStorage.setItem(`preference_${type}`, isEnabled);

  showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} ${isEnabled ? 'enabled' : 'disabled'}`, 'success');
}

// Load preferences
function loadPreferences() {
  // Load theme
  const theme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);

  const themeText = document.getElementById('themeText');
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  if (themeText) {
    themeText.textContent = theme === 'light' ? 'Light Mode' : 'Dark Mode';
  }
  if (themeToggleBtn) {
    themeToggleBtn.classList.toggle('active', theme === 'dark');
  }

  // Load celebration preference
  const celebrationsEnabled = localStorage.getItem('preference_celebrations') !== 'false';
  const celebrationBtn = document.getElementById('celebrationToggleBtn');
  if (celebrationBtn) {
    celebrationBtn.classList.toggle('active', celebrationsEnabled);
    celebrationBtn.querySelector('.toggle-text').textContent = celebrationsEnabled ? 'Enabled' : 'Disabled';
  }

  // Load notification preference
  const notificationsEnabled = localStorage.getItem('preference_notifications') !== 'false';
  const notificationBtn = document.getElementById('notificationToggleBtn');
  if (notificationBtn) {
    notificationBtn.classList.toggle('active', notificationsEnabled);
    notificationBtn.querySelector('.toggle-text').textContent = notificationsEnabled ? 'Enabled' : 'Disabled';
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? 'rgba(16, 185, 129, 0.9)' : type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)'};
    color: white;
    border-radius: 12px;
    font-weight: 600;
    font-size: 14px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Utility functions
function getTimeAgo(date) {
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
}

function formatNumber(num) {
  if (!num) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

console.log('Settings script loaded successfully');

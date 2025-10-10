// Admin Panel JavaScript

// Google Apps Script Web App URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwsQOwiJp9Wv-QVPB_9GWGz2mf4a-L2ibrdEisFIaO8fh8lADq3C2sKd9EnWmonXR3B/exec';

// Initialize Admin Panel
function initAdminPanel() {
  console.log('Initializing admin panel...');

  // Load statistics
  loadStatistics();

  // Load leaderboard data
  loadLeaderboardData();

  // Load transactions
  loadTransactions();

  // Load last sync time
  loadLastSyncTime();

  // Setup event listeners
  setupEventListeners();

  // Real-time listeners
  setupRealtimeListeners();
}

// Setup Event Listeners
function setupEventListeners() {
  // Manual sync button
  document.getElementById('manualSyncBtn').addEventListener('click', triggerManualSync);

  // View dashboard button
  document.getElementById('viewDashboardBtn').addEventListener('click', () => {
    window.open('/dashboard.html', '_blank');
  });

  // Export data button
  document.getElementById('exportDataBtn').addEventListener('click', exportToCSV);

  // Clear cache button
  document.getElementById('clearCacheBtn').addEventListener('click', clearCache);
}

// Setup Realtime Listeners
function setupRealtimeListeners() {
  // Listen to leaderboard changes
  database.ref('sparkTank/leaderboard').on('value', (snapshot) => {
    const data = snapshot.val();
    updateLeaderboardTable(data);
    updateStatistics(data);
  });

  // Listen to transactions
  database.ref('sparkTank/recentTransactions').on('value', (snapshot) => {
    const data = snapshot.val();
    updateTransactionsTable(data);
  });

  // Listen to last sync
  database.ref('sparkTank/lastSync').on('value', (snapshot) => {
    const timestamp = snapshot.val();
    updateLastSyncDisplay(timestamp);
  });
}

// Load Statistics
function loadStatistics() {
  database.ref('sparkTank/metadata').once('value').then((snapshot) => {
    const metadata = snapshot.val();
    if (metadata) {
      document.getElementById('totalSales').textContent = '₹' + formatNumber(metadata.totalSales || 0);
      document.getElementById('totalOrders').textContent = formatNumber(metadata.totalOrders || 0);
    }
  });
}

// Update Statistics
function updateStatistics(leaderboard) {
  if (!leaderboard) return;

  const teams = Array.isArray(leaderboard) ? leaderboard : Object.values(leaderboard);

  let totalSales = 0;
  let totalOrders = 0;

  teams.forEach(team => {
    totalSales += team.totalSales || 0;
    totalOrders += team.transactionCount || 0;
  });

  document.getElementById('totalSales').textContent = '₹' + formatNumber(totalSales);
  document.getElementById('totalOrders').textContent = formatNumber(totalOrders);
  document.getElementById('activeTeams').textContent = teams.length;
}

// Load Leaderboard Data
function loadLeaderboardData() {
  database.ref('sparkTank/leaderboard').once('value').then((snapshot) => {
    const data = snapshot.val();
    updateLeaderboardTable(data);
  });
}

// Update Leaderboard Table
function updateLeaderboardTable(data) {
  const tbody = document.getElementById('leaderboardTableBody');

  if (!data || (Array.isArray(data) && data.length === 0)) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--color-text-secondary);">No data available</td></tr>';
    return;
  }

  let leaderboard = Array.isArray(data) ? data : Object.values(data);
  leaderboard.sort((a, b) => a.rank - b.rank);

  tbody.innerHTML = leaderboard.map(team => `
    <tr>
      <td><strong>#${team.rank}</strong></td>
      <td>${team.teamName}</td>
      <td>${team.group || '-'}</td>
      <td><strong>₹${formatNumber(team.totalSales)}</strong></td>
      <td>${team.transactionCount || 0}</td>
      <td>₹${formatNumber(team.avgOrderValue || 0)}</td>
      <td>${getTrendEmoji(team.trend)}</td>
    </tr>
  `).join('');
}

// Load Transactions
function loadTransactions() {
  database.ref('sparkTank/recentTransactions').once('value').then((snapshot) => {
    const data = snapshot.val();
    updateTransactionsTable(data);
  });
}

// Update Transactions Table
function updateTransactionsTable(data) {
  const tbody = document.getElementById('transactionsTableBody');

  if (!data || (Array.isArray(data) && data.length === 0)) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--color-text-secondary);">No transactions yet</td></tr>';
    return;
  }

  let transactions = Array.isArray(data) ? data : Object.values(data);
  transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  tbody.innerHTML = transactions.slice(0, 50).map(t => `
    <tr>
      <td>${formatDateTime(t.timestamp)}</td>
      <td>${t.teamName}</td>
      <td><strong style="color: var(--color-success)">₹${formatNumber(t.amount)}</strong></td>
      <td style="font-family: monospace; font-size: 0.75rem;">${t.paymentId || '-'}</td>
      <td><span class="status-badge status-success">Success</span></td>
    </tr>
  `).join('');
}

// Load Last Sync Time
function loadLastSyncTime() {
  database.ref('sparkTank/lastSync').once('value').then((snapshot) => {
    const timestamp = snapshot.val();
    updateLastSyncDisplay(timestamp);
  });
}

// Update Last Sync Display
function updateLastSyncDisplay(timestamp) {
  const element = document.getElementById('lastSyncTime');

  if (!timestamp) {
    element.textContent = 'Never';
    return;
  }

  const date = new Date(timestamp);
  const timeAgo = getTimeAgo(date);

  element.textContent = timeAgo;
  element.title = date.toLocaleString();
}

// Trigger Manual Sync
async function triggerManualSync() {
  const btn = document.getElementById('manualSyncBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner" style="width: 20px; height: 20px;"></span><span>Syncing...</span>';

  try {
    // Call Google Apps Script Web App to trigger sync
    const response = await fetch(APPS_SCRIPT_URL + '?action=sync', {
      method: 'POST',
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error('Sync failed');
    }

    const result = await response.json();

    showSuccess('Sync completed successfully!');
    addLog('Manual sync triggered', 'success');

  } catch (error) {
    console.error('Sync error:', error);
    showError('Sync failed: ' + error.message);
    addLog('Sync failed: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>🔄</span><span>Manual Sync Now</span>';
  }
}

// Export to CSV
function exportToCSV() {
  database.ref('sparkTank/leaderboard').once('value').then((snapshot) => {
    const data = snapshot.val();

    if (!data) {
      showError('No data to export');
      return;
    }

    let leaderboard = Array.isArray(data) ? data : Object.values(data);
    leaderboard.sort((a, b) => a.rank - b.rank);

    // Create CSV content
    let csv = 'Rank,Team Name,Group,Total Sales,Orders,Avg Order Value,Trend\n';

    leaderboard.forEach(team => {
      csv += `${team.rank},"${team.teamName}","${team.group || ''}",${team.totalSales},${team.transactionCount || 0},${team.avgOrderValue || 0},"${team.trend || ''}"\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spark-tank-leaderboard-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showSuccess('Data exported successfully!');
  });
}

// Clear Cache
function clearCache() {
  if (confirm('Are you sure you want to clear the cache? This will reload the page.')) {
    localStorage.clear();
    sessionStorage.clear();
    location.reload(true);
  }
}

// Show Success Alert
function showSuccess(message) {
  const alert = document.getElementById('successAlert');
  alert.textContent = '✅ ' + message;
  alert.classList.add('show');

  setTimeout(() => {
    alert.classList.remove('show');
  }, 5000);
}

// Show Error Alert
function showError(message) {
  const alert = document.getElementById('errorAlert');
  alert.textContent = '❌ ' + message;
  alert.classList.add('show');

  setTimeout(() => {
    alert.classList.remove('show');
  }, 5000);
}

// Add Log Entry
function addLog(message, type = 'info') {
  const container = document.getElementById('logsContainer');

  const log = document.createElement('div');
  log.className = 'log-entry';

  const time = new Date().toLocaleTimeString();

  log.innerHTML = `
    <div class="log-time">${time}</div>
    <div>${type === 'error' ? '❌' : '✅'} ${message}</div>
  `;

  if (container.querySelector('p')) {
    container.innerHTML = '';
  }

  container.insertBefore(log, container.firstChild);

  // Keep only last 50 logs
  while (container.children.length > 50) {
    container.removeChild(container.lastChild);
  }
}

// Helper Functions
function formatNumber(num) {
  if (!num) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getTimeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getTrendEmoji(trend) {
  if (trend === 'up') return '📈';
  if (trend === 'down') return '📉';
  return '➖';
}

console.log('Admin script loaded successfully');

// Admin Panel JavaScript

// Google Apps Script Web App URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwsQOwiJp9Wv-QVPB_9GWGz2mf4a-L2ibrdEisFIaO8fh8lADq3C2sKd9EnWmonXR3B/exec';

// Global variable to store user's group name and account ID
let userGroupName = null;
let userAccountId = null;
let currentUserEmail = null;

// Initialize Group View Panel
async function initGroupView() {
  console.log('Initializing group view...');

  // Get current user
  const user = auth.currentUser;
  if (!user) {
    console.error('No user logged in');
    return;
  }

  currentUserEmail = user.email;

  // Get user's group name from access data FIRST (before loading any data)
  await loadUserGroupName(user.email);
  console.log('Group name loaded, proceeding with data load...');

  // Setup event listeners (non-data related)
  setupEventListeners();

  // NOW set up real-time listeners (after userGroupName is set)
  setupRealtimeListeners();

  // Load statistics
  loadStatistics();

  // Load leaderboard data
  loadLeaderboardData();

  // Load transactions
  loadTransactions();

  // Load last sync time
  loadLastSyncTime();
}

// Load User's Group Name from Access Data and find matching Account ID
async function loadUserGroupName(email) {
  try {
    const snapshot = await database.ref('access').once('value');
    const accessData = snapshot.val();

    if (accessData) {
      const accessArray = Array.isArray(accessData) ? accessData : Object.values(accessData);
      const userAccess = accessArray.find(user => user.Email === email);

      if (userAccess && userAccess['Group Name']) {
        userGroupName = userAccess['Group Name'];
        console.log('User group name:', userGroupName);

        // Now find the Account ID from leaderboard/MasterData
        await loadAccountIdForGroup(userGroupName);
      } else {
        console.log('No group assigned to user - Admin access');
      }
    }
  } catch (error) {
    console.error('Error loading user group:', error);
  }
}

// Load Account ID for the user's group by matching Group Name to Product/Service Name
async function loadAccountIdForGroup(groupName) {
  try {
    const snapshot = await database.ref('sparkTank/leaderboard').once('value');
    const leaderboard = snapshot.val();

    if (leaderboard) {
      const teams = Array.isArray(leaderboard) ? leaderboard : Object.values(leaderboard);

      // Match Group Name to Product/Service Name (teamName)
      const userTeam = teams.find(team => team.teamName === groupName);

      if (userTeam && userTeam.accountId) {
        userAccountId = userTeam.accountId;
        console.log('✅ Found Account ID for group:', userAccountId);
      } else {
        console.warn('⚠️ No Account ID found for group:', groupName);
      }
    }
  } catch (error) {
    console.error('Error loading account ID:', error);
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Manual sync button (optional - may not exist)
  const manualSyncBtn = document.getElementById('manualSyncBtn');
  if (manualSyncBtn) {
    manualSyncBtn.addEventListener('click', triggerManualSync);
  }

  // View dashboard button (optional)
  const viewDashboardBtn = document.getElementById('viewDashboardBtn');
  if (viewDashboardBtn) {
    viewDashboardBtn.addEventListener('click', () => {
      window.open('/dashboard.html', '_blank');
    });
  }

  // Export data button (optional)
  const exportDataBtn = document.getElementById('exportDataBtn');
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', exportToCSV);
  }

  // Clear cache button (optional)
  const clearCacheBtn = document.getElementById('clearCacheBtn');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', clearCache);
  }

  // View toggle buttons
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      switchView(view);

      // Update active state
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// Switch between views (leaderboard, transactions, logs)
function switchView(viewName) {
  // Hide all views
  const views = document.querySelectorAll('.admin-view');
  views.forEach(view => view.classList.remove('active'));

  // Show selected view
  const selectedView = document.getElementById(`${viewName}View`);
  if (selectedView) {
    selectedView.classList.add('active');
  }
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
    console.log('📡 Real-time listener fired for transactions');
    const data = snapshot.val();
    console.log('   Data received:', data ? (Array.isArray(data) ? data.length : Object.keys(data).length) + ' transactions' : 'null');
    try {
      console.log('   Calling updateTransactionsTable...');
      updateTransactionsTable(data);
      console.log('   ✅ updateTransactionsTable completed');
    } catch (error) {
      console.error('❌ Error in updateTransactionsTable:', error);
    }
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
      const totalSalesEl = document.getElementById('totalSales');
      const totalOrdersEl = document.getElementById('totalOrders');
      const activeTeamsEl = document.getElementById('activeTeams');

      if (totalSalesEl) totalSalesEl.textContent = '₹' + formatNumber(metadata.totalSales || 0);
      if (totalOrdersEl) totalOrdersEl.textContent = formatNumber(metadata.totalOrders || 0);
      if (activeTeamsEl) activeTeamsEl.textContent = metadata.activeTeams || 0;
    }
  });
}

// Update Statistics
function updateStatistics(leaderboard) {
  if (!leaderboard) return;

  let teams = Array.isArray(leaderboard) ? leaderboard : Object.values(leaderboard);

  // Filter teams by user's group name if not admin
  if (userGroupName) {
    teams = teams.filter(team => team.teamName === userGroupName);
  }

  let totalSales = 0;
  let totalOrders = 0;

  teams.forEach(team => {
    totalSales += team.totalSales || 0;
    totalOrders += team.transactionCount || 0;
  });

  const totalSalesEl = document.getElementById('totalSales');
  const totalOrdersEl = document.getElementById('totalOrders');
  const activeTeamsEl = document.getElementById('activeTeams');
  const avgOrderValueEl = document.getElementById('avgOrderValue');

  if (totalSalesEl) totalSalesEl.textContent = '₹' + formatNumber(totalSales);
  if (totalOrdersEl) totalOrdersEl.textContent = formatNumber(totalOrders);
  if (activeTeamsEl) activeTeamsEl.textContent = teams.length;

  const avgOrderValue = totalOrders > 0 ? Math.floor(totalSales / totalOrders) : 0;
  if (avgOrderValueEl) avgOrderValueEl.textContent = '₹' + formatNumber(avgOrderValue);
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

  if (!tbody) return; // Element doesn't exist on this page

  if (!data || (Array.isArray(data) && data.length === 0)) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--color-text-secondary);">No data available</td></tr>';
    return;
  }

  let leaderboard = Array.isArray(data) ? data : Object.values(data);

  // CRITICAL: Students MUST only see their group's leaderboard
  // Filter by matching team name (Product/Service Name)
  if (userGroupName) {
    console.log(`🔒 Filtering leaderboard for student group: ${userGroupName}`);
    const originalCount = leaderboard.length;

    leaderboard = leaderboard.filter(team => {
      const matches = team.teamName === userGroupName;
      if (!matches) {
        console.log(`❌ Filtered out team: ${team.teamName}`);
      } else {
        console.log(`✅ Keeping team: ${team.teamName} (Account ID: ${team.accountId})`);
      }
      return matches;
    });

    console.log(`✅ Filtered ${originalCount} teams → ${leaderboard.length} for group ${userGroupName}`);
  } else {
    console.log('👨‍💼 Admin view - showing all teams');
  }

  leaderboard.sort((a, b) => a.rank - b.rank);

  if (leaderboard.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--color-text-secondary);">No data for your group</td></tr>';
    return;
  }

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
  console.log('🔄 updateTransactionsTable called');
  console.log('   userAccountId:', userAccountId);
  console.log('   userGroupName:', userGroupName);

  const tbody = document.getElementById('transactionsTableBody');

  if (!tbody) {
    console.log('⚠️ transactionsTableBody element not found');
    return;
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--color-text-secondary);">No transactions yet</td></tr>';
    return;
  }

  let transactions = Array.isArray(data) ? data : Object.values(data);
  console.log('📊 Total transactions loaded:', transactions.length);

  // CRITICAL: Students MUST only see their group's transactions
  // Filter by Account ID (matched from MasterData)
  if (userAccountId) {
    console.log(`🔒 Filtering transactions for Account ID: ${userAccountId} (Group: ${userGroupName})`);
    const originalCount = transactions.length;

    transactions = transactions.filter(t => {
      const matches = t.accountId === userAccountId;
      if (!matches) {
        console.log(`❌ Filtered out: ${t.teamName} (Account ID: ${t.accountId})`);
      } else {
        console.log(`✅ Keeping: ${t.teamName} (Account ID: ${t.accountId})`);
      }
      return matches;
    });

    console.log(`✅ Filtered ${originalCount} transactions → ${transactions.length} for Account ID ${userAccountId}`);
  } else {
    console.log('⚠️ userAccountId is NULL - cannot filter!');
    console.log('   This should only happen for admins');
  }

  transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--color-text-secondary);">No transactions for your group yet</td></tr>';
    return;
  }

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

  if (!element) return; // Element doesn't exist on this page

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

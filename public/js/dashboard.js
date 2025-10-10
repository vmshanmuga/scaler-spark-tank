// Dashboard JavaScript - Real-time Leaderboard Logic

let previousLeaderboard = [];
let previousTransactions = [];
let lastUpdateTime = null;

// Medal emojis
const MEDALS = {
  1: '🥇',
  2: '🥈',
  3: '🥉'
};

// Initialize Dashboard
function initDashboard() {
  console.log('Initializing dashboard...');

  // Listen to leaderboard changes
  database.ref('sparkTank/leaderboard').on('value', (snapshot) => {
    const data = snapshot.val();
    handleLeaderboardUpdate(data);
  });

  // Listen to recent transactions
  database.ref('sparkTank/recentTransactions').on('value', (snapshot) => {
    const data = snapshot.val();
    handleTransactionsUpdate(data);
  });

  // Listen to last sync time
  database.ref('sparkTank/lastSync').on('value', (snapshot) => {
    const timestamp = snapshot.val();
    updateLastSyncTime(timestamp);
  });

  // Update "time ago" every second
  setInterval(updateTimeAgo, 1000);
}

// Handle Leaderboard Update
function handleLeaderboardUpdate(data) {
  console.log('Leaderboard update received:', data);

  if (!data || (Array.isArray(data) && data.length === 0)) {
    showEmptyState();
    return;
  }

  hideLoadingState();

  // Convert to array if it's an object
  let leaderboard = Array.isArray(data) ? data : Object.values(data);

  // Sort by rank
  leaderboard.sort((a, b) => a.rank - b.rank);

  // Check for new sales
  if (previousLeaderboard.length > 0) {
    checkForNewSales(leaderboard);
  }

  // Update stats cards
  updateStatsCards(leaderboard);

  // Render leaderboard
  renderLeaderboard(leaderboard);

  // Store for next comparison
  previousLeaderboard = JSON.parse(JSON.stringify(leaderboard));
}

// Check for New Sales
function checkForNewSales(newLeaderboard) {
  newLeaderboard.forEach((newTeam, index) => {
    const oldTeam = previousLeaderboard.find(t => t.group === newTeam.group);

    if (oldTeam && newTeam.totalSales > oldTeam.totalSales) {
      const saleAmount = newTeam.totalSales - oldTeam.totalSales;
      celebrateNewSale(newTeam.teamName, saleAmount);
    }
  });
}

// Celebrate New Sale
function celebrateNewSale(teamName, amount) {
  console.log(`🎉 New sale! ${teamName} - ₹${amount}`);

  const celebration = document.getElementById('saleCelebration');
  const celebrationText = document.getElementById('celebrationText');

  celebrationText.textContent = `+₹${formatNumber(amount)} for ${teamName}!`;

  celebration.classList.add('active');

  // Create confetti
  createConfetti();

  // Play sound (optional)
  // playSound('/assets/celebration.mp3');

  // Hide after 3 seconds
  setTimeout(() => {
    celebration.classList.remove('active');
  }, 3000);
}

// Create Confetti
function createConfetti() {
  const container = document.getElementById('confettiContainer');
  container.innerHTML = ''; // Clear previous confetti

  const colors = ['#8B5CF6', '#EC4899', '#F97316', '#FB923C', '#F472B6', '#A855F7'];
  const confettiCount = 100;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = (Math.random() * 0.5) + 's';
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    container.appendChild(confetti);
  }

  // Clear confetti after animation
  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}

// Render Leaderboard
function renderLeaderboard(leaderboard) {
  const container = document.getElementById('leaderboard');
  container.innerHTML = '';
  container.style.display = 'flex';

  leaderboard.forEach((team, index) => {
    const card = createLeaderboardCard(team);
    card.style.animationDelay = `${index * 0.1}s`;
    container.appendChild(card);
  });
}

// Create Leaderboard Card
function createLeaderboardCard(team) {
  const card = document.createElement('div');
  card.className = 'leaderboard-card animate-fade-in-up';
  card.setAttribute('data-rank', team.rank);

  const medal = MEDALS[team.rank] || '';
  const trendIcon = team.trend === 'up' ? '📈' : team.trend === 'down' ? '📉' : '➖';
  const trendClass = team.trend === 'up' ? '' : team.trend === 'down' ? 'down' : '';

  card.innerHTML = `
    <div class="card-header">
      <div class="rank-badge">
        <span>${medal}</span>
        <span class="rank-number">#${team.rank}</span>
      </div>

      <div class="team-info">
        <h2 class="team-name">${team.teamName}</h2>
        <p class="team-members">${team.members ? team.members.join(' • ') : ''}</p>
      </div>

      <div class="sales-amount">
        <div class="amount-value">₹${formatNumber(team.totalSales)}</div>
        <div class="amount-label">Total Sales</div>
      </div>
    </div>

    <div class="card-footer">
      <div class="stats">
        <div class="stat">
          <div class="stat-value">📦 ${team.transactionCount || 0}</div>
          <div class="stat-label">Orders</div>
        </div>
        ${team.avgOrderValue ? `
        <div class="stat">
          <div class="stat-value">₹${formatNumber(team.avgOrderValue)}</div>
          <div class="stat-label">Avg Order</div>
        </div>
        ` : ''}
      </div>

      ${team.trend ? `
      <div class="trend-indicator ${trendClass}">
        <span>${trendIcon}</span>
        <span>${team.trend === 'up' ? 'Trending Up' : team.trend === 'down' ? 'Trending Down' : 'Stable'}</span>
      </div>
      ` : ''}
    </div>
  `;

  return card;
}

// Handle Transactions Update
function handleTransactionsUpdate(data) {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return;
  }

  let transactions = Array.isArray(data) ? data : Object.values(data);

  // Sort by timestamp (newest first)
  transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Take only recent 20
  transactions = transactions.slice(0, 20);

  // Render ticker
  renderTransactionsTicker(transactions);

  previousTransactions = transactions;
}

// Render Transactions Ticker
function renderTransactionsTicker(transactions) {
  const ticker = document.getElementById('transactionsTicker');
  const content = document.getElementById('tickerContent');

  if (transactions.length === 0) {
    ticker.style.display = 'none';
    return;
  }

  ticker.style.display = 'block';

  // Create transaction items
  const items = transactions.map(t => createTransactionItem(t)).join('');

  // Duplicate for seamless scroll
  content.innerHTML = items + items;
}

// Create Transaction Item
function createTransactionItem(transaction) {
  const timeAgo = getTimeAgo(new Date(transaction.timestamp));

  return `
    <div class="transaction-item">
      <span class="transaction-icon">💳</span>
      <span class="transaction-team">${transaction.teamName}</span>
      <span>-</span>
      <span class="transaction-amount">₹${formatNumber(transaction.amount)}</span>
      <span>•</span>
      <span class="transaction-time">${timeAgo}</span>
    </div>
  `;
}

// Update Last Sync Time
function updateLastSyncTime(timestamp) {
  if (!timestamp) return;

  lastUpdateTime = new Date(timestamp);
  updateTimeAgo();
}

// Update Time Ago Display
function updateTimeAgo() {
  if (!lastUpdateTime) return;

  const timeAgo = getTimeAgo(lastUpdateTime);
  document.getElementById('lastUpdated').textContent = `Last updated: ${timeAgo}`;
}

// Get Time Ago
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

// Update Stats Cards
function updateStatsCards(leaderboard) {
  let totalSales = 0;
  let totalOrders = 0;
  const activeTeams = leaderboard.length;

  leaderboard.forEach(team => {
    totalSales += team.totalSales || 0;
    totalOrders += team.transactionCount || 0;
  });

  const avgOrderValue = totalOrders > 0 ? Math.floor(totalSales / totalOrders) : 0;

  // Update DOM elements
  const totalSalesEl = document.getElementById('totalSales');
  const totalOrdersEl = document.getElementById('totalOrders');
  const activeTeamsEl = document.getElementById('activeTeams');
  const avgOrderValueEl = document.getElementById('avgOrderValue');

  if (totalSalesEl) totalSalesEl.textContent = `₹${formatNumber(totalSales)}`;
  if (totalOrdersEl) totalOrdersEl.textContent = formatNumber(totalOrders);
  if (activeTeamsEl) activeTeamsEl.textContent = activeTeams;
  if (avgOrderValueEl) avgOrderValueEl.textContent = `₹${formatNumber(avgOrderValue)}`;

  console.log('📊 Stats updated:', { totalSales, totalOrders, activeTeams, avgOrderValue });
}

// Format Number with Commas
function formatNumber(num) {
  if (!num) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Show Loading State
function showLoadingState() {
  document.getElementById('loadingState').style.display = 'flex';
  document.getElementById('leaderboard').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
}

// Hide Loading State
function hideLoadingState() {
  document.getElementById('loadingState').style.display = 'none';
}

// Show Empty State
function showEmptyState() {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('leaderboard').style.display = 'none';
  document.getElementById('emptyState').style.display = 'block';
}

// Play Sound (Optional)
function playSound(soundUrl) {
  const audio = new Audio(soundUrl);
  audio.volume = 0.3;
  audio.play().catch(e => console.log('Sound play failed:', e));
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // F11 - Toggle fullscreen
  if (e.key === 'F11') {
    e.preventDefault();
    toggleFullscreen();
  }

  // R - Manual refresh
  if (e.key === 'r' || e.key === 'R') {
    location.reload();
  }
});

// Toggle Fullscreen
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error('Fullscreen error:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

// Count-up animation for numbers
function animateValue(element, start, end, duration) {
  const range = end - start;
  const increment = range / (duration / 16); // 60 FPS
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= end) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = '₹' + formatNumber(Math.floor(current));
  }, 16);
}

// Error handling
window.addEventListener('error', (e) => {
  console.error('Global error:', e);
});

// Connection state monitoring
database.ref('.info/connected').on('value', (snapshot) => {
  if (snapshot.val() === true) {
    console.log('✅ Connected to Firebase');
  } else {
    console.log('❌ Disconnected from Firebase');
  }
});

console.log('Dashboard script loaded successfully');

// ========== THEME TOGGLE ==========
// Note: Theme toggle is now handled in sidebar.js


// Sidebar functionality

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const menuToggle = document.getElementById('menuToggle');

  // Show admin nav if user is admin (from localStorage)
  const isAdminUser = localStorage.getItem('isAdmin') === 'true';
  const adminNavElement = document.getElementById('adminNav');
  console.log('🔍 Admin nav check:', {
    isAdminUser,
    adminNavExists: !!adminNavElement,
    localStorageIsAdmin: localStorage.getItem('isAdmin')
  });
  if (adminNavElement && isAdminUser) {
    adminNavElement.style.display = 'flex';
    console.log('✅ Admin nav displayed');
  } else {
    console.log('❌ Admin nav NOT displayed - isAdmin:', isAdminUser, 'element exists:', !!adminNavElement);
  }

  // Toggle sidebar collapse (desktop)
  sidebarToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    console.log('Sidebar toggled:', sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
  });

  // Click on collapsed sidebar to expand (including the ::before pseudo-element area)
  sidebar?.addEventListener('click', (e) => {
    if (sidebar.classList.contains('collapsed')) {
      // Don't expand if clicking on nav items or buttons
      if (!e.target.closest('.nav-item, .btn-sidebar')) {
        sidebar.classList.remove('collapsed');
        localStorage.setItem('sidebarCollapsed', 'false');
        console.log('Sidebar expanded via click');
      }
    }
  });

  // Toggle sidebar open/close (mobile)
  menuToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close sidebar when clicking outside (mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024) {
      if (!sidebar.contains(e.target) && !menuToggle?.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });

  // Restore sidebar state
  const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  if (sidebarCollapsed) {
    sidebar.classList.add('collapsed');
  }

  // Listen to stats data
  database.ref('sparkTank/leaderboard').on('value', (snapshot) => {
    const data = snapshot.val();
    updateStats(data);
  });
}

// Handle manual sync
async function handleManualSync() {
  const btn = document.getElementById('sidebarSyncBtn');
  const originalHTML = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-label">Syncing...</span>';

    // Call Google Apps Script to trigger sync
    const response = await fetch('https://script.google.com/macros/s/AKfycbwsQOwiJp9Wv-QVPB_9GWGz2mf4a-L2ibrdEisFIaO8fh8lADq3C2sKd9EnWmonXR3B/exec?action=syncToFirebase', {
      method: 'GET',
      mode: 'cors'
    });

    const result = await response.json();

    if (result.success) {
      showNotification('✅ Sync successful!', 'success');
    } else {
      throw new Error(result.message || 'Sync failed');
    }
  } catch (error) {
    console.error('Sync error:', error);
    showNotification('❌ Sync failed. Please try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}

// Export to CSV
function exportToCSV() {
  database.ref('sparkTank/leaderboard').once('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      showNotification('❌ No data available to export', 'error');
      return;
    }

    const leaderboard = Array.isArray(data) ? data : Object.values(data);

    // Create CSV content
    const headers = ['Rank', 'Team Name', 'Product', 'Total Sales', 'Orders', 'Avg Order Value'];
    const rows = leaderboard.map(team => [
      team.rank,
      team.teamName,
      team.productName || '',
      team.totalSales,
      team.transactionCount || 0,
      team.avgOrderValue || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaderboard-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showNotification('✅ Data exported successfully!', 'success');
  });
}

// Clear cache
function clearCache() {
  if (confirm('Are you sure you want to clear the cache? This will reload the page.')) {
    localStorage.clear();
    sessionStorage.clear();

    // Clear service worker cache if exists
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }

    showNotification('✅ Cache cleared!', 'success');
    setTimeout(() => {
      location.reload(true);
    }, 1000);
  }
}

// Update stats
function updateStats(data) {
  if (!data) return;

  const leaderboard = Array.isArray(data) ? data : Object.values(data);

  let totalSales = 0;
  let totalOrders = 0;
  let activeTeams = leaderboard.length;

  leaderboard.forEach(team => {
    totalSales += team.totalSales || 0;
    totalOrders += team.transactionCount || 0;
  });

  const avgOrderValue = totalOrders > 0 ? Math.floor(totalSales / totalOrders) : 0;

  // Update stat cards
  const totalSalesEl = document.getElementById('totalSales');
  const totalOrdersEl = document.getElementById('totalOrders');
  const activeTeamsEl = document.getElementById('activeTeams');
  const avgOrderValueEl = document.getElementById('avgOrderValue');

  if (totalSalesEl) totalSalesEl.textContent = `₹${formatNumber(totalSales)}`;
  if (totalOrdersEl) totalOrdersEl.textContent = formatNumber(totalOrders);
  if (activeTeamsEl) activeTeamsEl.textContent = activeTeams;
  if (avgOrderValueEl) avgOrderValueEl.textContent = `₹${formatNumber(avgOrderValue)}`;
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? 'rgba(29, 143, 91, 0.9)' : type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)'};
    color: white;
    border-radius: 12px;
    font-weight: 600;
    font-size: 14px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Theme toggle for new layout
const themeToggleBtn = document.getElementById('themeToggle');
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    const themeIcon = themeToggleBtn.querySelector('.theme-icon');
    themeIcon.textContent = newTheme === 'light' ? '☀️' : '🌙';
  });

  // Initialize theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const themeIcon = themeToggleBtn.querySelector('.theme-icon');
  themeIcon.textContent = savedTheme === 'light' ? '☀️' : '🌙';
}

// Add animations to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

console.log('Sidebar script loaded successfully');

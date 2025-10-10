// Shared Sidebar Component - Simple & Centralized Admin Logic

/**
 * Initialize sidebar with admin visibility
 * Call this AFTER user authentication is complete
 */
async function initSharedSidebar(currentUser) {
  console.log('🔧 Initializing shared sidebar for:', currentUser.email);

  // Check if user is admin
  const userIsAdmin = await isAdmin(currentUser.email);
  console.log('👤 User admin status:', userIsAdmin);

  // Show/hide admin nav based on admin status
  const adminNavElement = document.getElementById('adminNav');
  if (adminNavElement) {
    if (userIsAdmin) {
      adminNavElement.style.display = 'flex';
      console.log('✅ Admin nav SHOWN');
    } else {
      adminNavElement.style.display = 'none';
      console.log('❌ Admin nav HIDDEN');
    }
  } else {
    console.warn('⚠️ Admin nav element not found');
  }

  // Initialize sidebar interactions
  setupSidebarInteractions();
}

/**
 * Setup sidebar collapse/expand and mobile interactions
 */
function setupSidebarInteractions() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const menuToggle = document.getElementById('menuToggle');

  // Toggle sidebar collapse (desktop)
  sidebarToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  });

  // Click on collapsed sidebar to expand
  sidebar?.addEventListener('click', (e) => {
    if (sidebar.classList.contains('collapsed')) {
      if (!e.target.closest('.nav-item, .btn-sidebar')) {
        sidebar.classList.remove('collapsed');
        localStorage.setItem('sidebarCollapsed', 'false');
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

  // Setup theme toggle
  setupThemeToggle();

  console.log('✅ Sidebar interactions setup complete');
}

/**
 * Setup theme toggle functionality
 */
function setupThemeToggle() {
  const themeToggleBtn = document.getElementById('themeToggle');

  if (!themeToggleBtn) {
    console.warn('⚠️ Theme toggle button not found');
    return;
  }

  // Remove any existing event listeners by cloning the button
  const newThemeToggleBtn = themeToggleBtn.cloneNode(true);
  themeToggleBtn.parentNode.replaceChild(newThemeToggleBtn, themeToggleBtn);

  // Add click handler
  newThemeToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    console.log('🎨 Switching theme from', currentTheme, 'to', newTheme);

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    const themeIcon = newThemeToggleBtn.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    }
  });

  // Restore theme and icon
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const themeIcon = newThemeToggleBtn.querySelector('.theme-icon');
  if (themeIcon) {
    themeIcon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
  }

  console.log('✅ Theme toggle setup complete, current theme:', savedTheme);
}

console.log('📦 Shared sidebar component loaded');

// Format numbers with commas
export function formatNumber(num) {
  if (!num && num !== 0) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}

// Format currency (INR)
export function formatCurrency(amount) {
  if (!amount && amount !== 0) return '₹0';
  return `₹${formatNumber(amount)}`;
}

// Format date and time
export function formatDateTime(timestamp) {
  if (!timestamp) return '-';

  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return 'Just now';
  }

  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }

  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }

  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }

  // Otherwise, show full date
  const options = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return date.toLocaleString('en-US', options);
}

// Format full date
export function formatFullDate(timestamp) {
  if (!timestamp) return '-';

  const date = new Date(timestamp);
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };

  return date.toLocaleString('en-US', options);
}

// Get status color class
export function getStatusClass(status) {
  if (!status) return '';
  const statusLower = status.toLowerCase();

  if (statusLower === 'paid') {
    return 'status-paid';
  } else if (statusLower === 'captured') {
    return 'status-captured';
  } else if (statusLower === 'authorized') {
    return 'status-authorized';
  } else if (statusLower === 'failed' || statusLower === 'refunded' || statusLower === 'cancelled') {
    return 'status-error';
  } else if (statusLower === 'pending' || statusLower === 'processing') {
    return 'status-warning';
  } else if (statusLower === 'processed' || statusLower === 'success') {
    return 'status-success';
  }

  return '';
}

// Get event type emoji
export function getEventEmoji(eventType) {
  if (!eventType) return '📦';

  const type = eventType.toLowerCase();

  if (type.includes('payment') && type.includes('captured')) return '💰';
  if (type.includes('order') && type.includes('paid')) return '🎉';
  if (type.includes('payment_link')) return '🔗';
  if (type.includes('qr_code')) return '📱';
  if (type.includes('refund')) return '💸';
  if (type.includes('authorized')) return '✅';
  if (type.includes('failed')) return '❌';

  return '📦';
}

// Get team color
const teamColors = [
  'team-color-0', // purple
  'team-color-1', // pink
  'team-color-2', // blue
  'team-color-3', // green
  'team-color-4', // orange
  'team-color-5', // rose
  'team-color-6', // cyan
  'team-color-7', // violet
  'team-color-8', // emerald
  'team-color-9'  // amber
];

const teamColorMap = {};

export function getTeamColorClass(teamName) {
  if (!teamName) return teamColors[0];

  if (!teamColorMap[teamName]) {
    const index = Object.keys(teamColorMap).length % teamColors.length;
    teamColorMap[teamName] = teamColors[index];
  }

  return teamColorMap[teamName];
}

// Get rank emoji
export function getRankEmoji(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

// Get trend icon
export function getTrendIcon(trend) {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
}

// Filter transactions by event type
export function filterTransactionsByEvent(transactions, eventFilter) {
  if (!transactions) return [];
  if (eventFilter === 'all') return transactions;

  // Special case: status-based filtering
  if (eventFilter.startsWith('status:')) {
    const status = eventFilter.replace('status:', '').toLowerCase();
    return transactions.filter(t =>
      t.status && t.status.toLowerCase() === status
    );
  }

  // Check if eventFilter contains 'refund' as a keyword
  if (eventFilter.includes('refund')) {
    return transactions.filter(t =>
      t.eventType && t.eventType.toLowerCase().includes('refund')
    );
  }

  // Exact match
  return transactions.filter(t =>
    t.eventType && t.eventType.toLowerCase() === eventFilter.toLowerCase()
  );
}

// Filter transactions by team
export function filterTransactionsByTeam(transactions, teamName) {
  if (!transactions) return [];
  if (teamName === 'all') return transactions;

  return transactions.filter(t => t.teamName === teamName);
}

// Get unique teams from transactions
export function getUniqueTeams(transactions) {
  if (!transactions) return [];

  const teams = [...new Set(transactions.map(t => t.teamName).filter(Boolean))];
  return teams.sort();
}

// Calculate percentage change
export function calculatePercentageChange(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Get first name from full name
export function getFirstName(fullName) {
  if (!fullName) return '';
  return fullName.split(' ')[0];
}

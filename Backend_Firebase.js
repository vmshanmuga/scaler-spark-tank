/**
 * Project: Scaler Spark Tank
 * Project ID: scaler-spark-tank
 * Project Number: 88572481923
 * Parent Org/Folder in GCP: sst.scaler.com
 * Firebase Web API Key: AIzaSyBbRhFAMsAkFjV8M1bttbDouP0MdSLg3C8
 *
 * Backend: Google Apps Script
 * Frontend: Firebase Hosting (HTML/JS only)
 */

// ========== CONFIG ==========
const SHEET_ID = '1QStnIu1GxQrO7vzZDb57lmkqb3N6fXex3TUW-5Secwg';

// Subsheet names
const MASTERDATA_SHEET = 'MasterData';
const PAYMENTS_SHEET = 'Razorpay_Payments';
const Access_sheet = 'Access'

// Firebase credentials (frontend will use this config to fetch data)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBbRhFAMsAkFjV8M1bttbDouP0MdSLg3C8",
  authDomain: "sst.scaler.com",
  projectId: "scaler-spark-tank",
  storageBucket: "scaler-spark-tank.appspot.com",
  messagingSenderId: "88572481923",
  appId: "1:88572481923:web:22b57173f6c10bfb55e6b6" // replace with Firebase App ID
};

// ========== SHEET COLUMN HEADERS ==========

// MasterData Columns
// Explanation:
// Each row represents a participant group
// Contains participant names & emails, Razorpay credentials, account info, and webhook secret
const MASTERDATA_HEADERS = [
  'Group',                // Name of the participant group
  'Product/Service Name', // Name of the product or service
  'Name1','Email1',       // Participant 1
  'Name2','Email2',       // Participant 2
  'Name3','Email3',       // Participant 3
  'Name4','Email4',       // Participant 4
  'Name5','Email5',       // Participant 5
  'Razorpay ID',          // Razorpay login ID
  'Pass',                 // Razorpay password
  'Account ID',           // Razorpay account ID
  'Account Name',         // Razorpay account name
  'Account Email',        // Razorpay account email
  'Webhook Secret'        // Razorpay webhook secret
];

// Razorpay_Payments Columns
// Explanation:
// Each row represents a payment event from Razorpay
// Will be used to compute the leaderboard
const PAYMENTS_HEADERS = [
  'Timestamp',              // Payment timestamp
  'Event Type',             // e.g., payment.captured
  'Entity Type',            // Type of entity
  'Entity ID',              // Razorpay entity ID
  'Order ID',               // Razorpay order ID
  'Amount',                 // Amount paid
  'Currency',               // Currency code, e.g., INR
  'Customer Email',         // Email of payer
  'Customer Name',          // Name of payer
  'Status',                 // Payment status (captured/failed/refunded)
  'Notes',                  // Any notes
  'Extra ID (QR / Payment Link)', // Additional identifiers
  'Razorpay Account ID',    // Account ID
  'Razorpay Account Email'  // Account email
];

const Access_HEADERS = [
  'Email',                // Email of users who has access (Column A in sheet)
  'Name',                 // Name of user (Column B in sheet)
  'Access Type',          // Access type (Admin/Student) (Column C in sheet)
  'Group Name'            // Group Name (if applicable) (Column D in sheet)
];

// Firebase Realtime Database URL
const FIREBASE_DB_URL = 'https://scaler-spark-tank-default-rtdb.firebaseio.com';

// Get Firebase ID Token (requires setup in Firebase Console)
// For Apps Script, we'll use a service account or web API key
// Using direct secret for now (in production, use Script Properties)
const FIREBASE_SECRET = 'AZCq5RnvlN13mSMDBklEKUYE5MzeiBZaD9J9oKvJ';

// ========== MAIN SYNC FUNCTION ==========

/**
 * Main function to sync data from Google Sheets to Firebase
 * This should be triggered periodically (every 1-5 minutes)
 */
function syncToFirebase() {
  try {
    Logger.log('=== Starting sync to Firebase ===');

    const startTime = new Date();

    // Read data from sheets
    const masterData = readMasterData();
    const paymentsData = readPaymentsData();
    const accessData = readAccessData();

    // Calculate leaderboard
    const leaderboard = calculateLeaderboard(masterData, paymentsData);

    // Get recent transactions
    const recentTransactions = getRecentTransactions(paymentsData, masterData, 20);

    // Calculate metadata
    const metadata = calculateMetadata(leaderboard);

    // Prepare Firebase data structure
    const firebaseData = {
      leaderboard: leaderboard,
      recentTransactions: recentTransactions,
      lastSync: new Date().toISOString(),
      metadata: metadata
    };

    // Push to Firebase
    pushToFirebase('sparkTank', firebaseData);

    // Also sync access list
    pushToFirebase('access', accessData);

    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;

    Logger.log(`✅ Sync completed successfully in ${duration}s`);
    Logger.log(`Synced ${leaderboard.length} teams, ${recentTransactions.length} transactions`);

    return {
      success: true,
      message: 'Sync completed successfully',
      duration: duration,
      teamsCount: leaderboard.length,
      transactionsCount: recentTransactions.length
    };

  } catch (error) {
    Logger.log('❌ Sync error: ' + error.toString());
    return {
      success: false,
      message: 'Sync failed: ' + error.toString()
    };
  }
}

// ========== DATA READING FUNCTIONS ==========

/**
 * Read MasterData sheet
 */
function readMasterData() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(MASTERDATA_SHEET);

  if (!sheet) {
    throw new Error('MasterData sheet not found');
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  }).filter(row => row['Group']); // Filter out empty rows
}

/**
 * Read Razorpay_Payments sheet
 */
function readPaymentsData() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(PAYMENTS_SHEET);

  if (!sheet) {
    Logger.log('⚠️  Payments sheet not found - returning empty array');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    Logger.log('⚠️  No payment data found');
    return [];
  }

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  }).filter(row => row['Amount'] && row['Status']); // Filter valid payments
}

/**
 * Read Access sheet
 */
function readAccessData() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(Access_sheet);

  if (!sheet) {
    Logger.log('⚠️  Access sheet not found - returning empty array');
    return [];
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  }).filter(row => row['Email']); // Filter out empty rows
}

// ========== CALCULATION FUNCTIONS ==========

/**
 * Calculate leaderboard from master data and payments
 */
function calculateLeaderboard(masterData, paymentsData) {
  const leaderboard = [];

  masterData.forEach(team => {
    const group = team['Group'];
    const teamName = team['Product/Service Name'];
    const accountEmail = team['Account Email'];
    const accountId = team['Account ID'];

    // Get team members
    const members = [];
    for (let i = 1; i <= 5; i++) {
      const name = team[`Name${i}`];
      if (name) {
        members.push(name.split(' ')[0]); // First name only
      }
    }

    // Calculate total sales for this team
    // Only count order.paid and payment_link.paid events to avoid duplicate counting
    const teamPayments = paymentsData.filter(payment => {
      const paymentAccountId = payment['Razorpay Account ID'];
      const eventType = payment['Event Type'];
      const status = payment['Status'];

      // Match by Account ID and only count final payment events
      return (paymentAccountId === accountId) &&
             (eventType === 'order.paid' || eventType === 'payment_link.paid') &&
             (status === 'paid');
    });

    const totalSales = teamPayments.reduce((sum, payment) => {
      const amount = parseFloat(payment['Amount']) || 0;
      return sum + amount; // No conversion - show amount as-is from sheet
    }, 0);

    const transactionCount = teamPayments.length;
    const avgOrderValue = transactionCount > 0 ? totalSales / transactionCount : 0;

    // Calculate trend (compare last 5 transactions vs previous 5)
    let trend = 'stable';
    if (teamPayments.length >= 10) {
      const sortedPayments = teamPayments.sort((a, b) =>
        new Date(b['Timestamp']) - new Date(a['Timestamp'])
      );
      const recentAvg = sortedPayments.slice(0, 5).reduce((sum, p) =>
        sum + (parseFloat(p['Amount']) || 0), 0) / 5;
      const previousAvg = sortedPayments.slice(5, 10).reduce((sum, p) =>
        sum + (parseFloat(p['Amount']) || 0), 0) / 5;

      if (recentAvg > previousAvg * 1.1) trend = 'up';
      else if (recentAvg < previousAvg * 0.9) trend = 'down';
    }

    // Get last transaction time
    const lastTransaction = teamPayments.length > 0 ?
      teamPayments.sort((a, b) => new Date(b['Timestamp']) - new Date(a['Timestamp']))[0]['Timestamp'] : null;

    leaderboard.push({
      group: group,
      teamName: teamName,
      accountId: accountId, // Include Account ID for filtering
      members: members,
      totalSales: Math.round(totalSales), // Round to nearest rupee
      transactionCount: transactionCount,
      avgOrderValue: Math.round(avgOrderValue),
      trend: trend,
      lastTransaction: lastTransaction,
      rank: 0 // Will be set after sorting
    });
  });

  // Sort by total sales (descending) and assign ranks
  leaderboard.sort((a, b) => b.totalSales - a.totalSales);
  leaderboard.forEach((team, index) => {
    team.rank = index + 1;
  });

  return leaderboard;
}

/**
 * Get recent transactions
 */
function getRecentTransactions(paymentsData, masterData, limit = 50) {
  // Show ALL payment events (not just paid ones)
  const allPayments = paymentsData.filter(payment => {
    return payment['Event Type'] && payment['Timestamp']; // Only need valid event type and timestamp
  });

  // Sort by timestamp (newest first)
  allPayments.sort((a, b) => new Date(b['Timestamp']) - new Date(a['Timestamp']));

  // Take only recent ones
  const recentPayments = allPayments.slice(0, limit);

  // Map to transaction objects with team names
  return recentPayments.map(payment => {
    const accountEmail = payment['Razorpay Account Email'];
    const accountId = payment['Razorpay Account ID'];

    // Find matching team
    const team = masterData.find(t =>
      t['Account Email'] === accountEmail || t['Account ID'] === accountId
    );

    const teamName = team ? team['Product/Service Name'] : 'Unknown Team';
    const group = team ? team['Group'] : '';

    return {
      teamName: teamName,
      group: group,
      accountId: accountId, // Include Account ID for filtering
      amount: parseFloat(payment['Amount']) || 0, // Show amount as-is from sheet
      timestamp: payment['Timestamp'],
      paymentId: payment['Entity ID'] || '',
      status: payment['Status'],
      eventType: payment['Event Type'] // Include event type
    };
  });
}

/**
 * Calculate metadata
 */
function calculateMetadata(leaderboard) {
  const totalSales = leaderboard.reduce((sum, team) => sum + team.totalSales, 0);
  const totalOrders = leaderboard.reduce((sum, team) => sum + team.transactionCount, 0);

  return {
    totalSales: totalSales,
    totalOrders: totalOrders,
    activeTeams: leaderboard.length,
    lastCalculated: new Date().toISOString()
  };
}

// ========== FIREBASE FUNCTIONS ==========

/**
 * Push data to Firebase Realtime Database
 */
function pushToFirebase(path, data) {
  const url = `${FIREBASE_DB_URL}/${path}.json`;

  const options = {
    method: 'put',
    contentType: 'application/json',
    payload: JSON.stringify(data),
    muteHttpExceptions: true
  };

  // If Firebase secret is configured, add it to URL
  const finalUrl = FIREBASE_SECRET ? `${url}?auth=${FIREBASE_SECRET}` : url;

  const response = UrlFetchApp.fetch(finalUrl, options);
  const responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    throw new Error(`Firebase push failed: ${responseCode} - ${response.getContentText()}`);
  }

  Logger.log(`✅ Pushed data to Firebase: /${path}`);
}

// ========== WEB APP FUNCTIONS ==========

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  const action = e.parameter.action || 'status';

  if (action === 'status') {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'online',
      timestamp: new Date().toISOString(),
      message: 'Scaler Spark Tank Backend is running'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'test') {
    const result = syncToFirebase();
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput('Invalid action');
}

/**
 * Handle POST requests (for manual sync from admin panel)
 */
function doPost(e) {
  const action = e.parameter.action || '';

  if (action === 'sync') {
    const result = syncToFirebase();
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: 'Invalid action'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ========== TRIGGER SETUP ==========

/**
 * Set up time-driven trigger (run this once to set up automatic sync)
 * This will sync data every 5 minutes
 */
function setupTimeDrivenTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncToFirebase') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger - every 5 minutes
  ScriptApp.newTrigger('syncToFirebase')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('✅ Time-driven trigger set up successfully');
}

/**
 * Remove all triggers
 */
function removeAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });

  Logger.log('✅ All triggers removed');
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Test function to check if everything is working
 */
function testSync() {
  Logger.log('=== Testing Sync ===');

  const masterData = readMasterData();
  Logger.log(`Master Data: ${masterData.length} teams`);

  const paymentsData = readPaymentsData();
  Logger.log(`Payments Data: ${paymentsData.length} payments`);

  const leaderboard = calculateLeaderboard(masterData, paymentsData);
  Logger.log(`Leaderboard: ${JSON.stringify(leaderboard, null, 2)}`);

  const result = syncToFirebase();
  Logger.log(`Sync Result: ${JSON.stringify(result, null, 2)}`);
}


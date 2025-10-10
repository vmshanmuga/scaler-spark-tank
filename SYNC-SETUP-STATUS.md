# ✅ Google Sheets → Firebase Sync - Setup Status

**Project:** Scaler Spark Tank 2025 Leaderboard
**Date:** October 9, 2025
**Status:** Ready for Configuration

---

## 🎯 Current Status

### ✅ **Completed**

1. **Frontend Dashboard** - Fully redesigned with Shadcn UI
   - Collapsible sidebar with sync controls
   - Stats cards showing real-time metrics
   - Leaderboard with ranking system
   - Recent transactions display
   - Manual sync functionality
   - CSV export feature
   - Theme toggle (light/dark mode)

2. **Apps Script Integration** - Backend URL configured
   - URL: `https://script.google.com/.../exec`
   - Status: ✅ Online and responding
   - Configured in: `admin.js` and `sidebar.js`

3. **Firebase Configuration** - Database ready
   - Project: `scaler-spark-tank`
   - Database URL: `https://scaler-spark-tank-default-rtdb.firebaseio.com`
   - Authentication: Google OAuth enabled
   - Access control: Domain-based (@ssb.scaler.com)

4. **Complete Documentation** - Ready to follow
   - ✅ `google-apps-script/Code.gs` - Complete sync script
   - ✅ `google-apps-script/QUICKSTART.md` - 5-minute setup guide
   - ✅ `google-apps-script/SETUP.md` - Detailed instructions
   - ✅ `google-apps-script/SHEETS-TEMPLATE.md` - Data structure
   - ✅ `google-apps-script/README.md` - Overview and reference

---

## 🚀 What You Need to Do

### **Option 1: Use Existing Apps Script Deployment**

If the current Apps Script URL (`AKfycbwsQOwiJp9Wv-QVPB_9GWGz2mf4a-L2ibrdEisFIaO8fh8lADq3C2sKd9EnWmonXR3B`) is your deployment:

1. ✅ Frontend URLs are already configured
2. ⏳ Just verify the script has your Firebase secret
3. ⏳ Set up time-based trigger (every 5 minutes)
4. ✅ Done! Data will sync automatically

### **Option 2: Deploy New Apps Script**

If you need to create a fresh deployment:

1. **Read:** `google-apps-script/QUICKSTART.md`
2. **Get Firebase Secret:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select: `scaler-spark-tank`
   - Settings → Service Accounts → Database Secrets
   - Copy the secret
3. **Deploy Code.gs:**
   - Open your Google Sheets
   - Extensions → Apps Script
   - Copy all code from `google-apps-script/Code.gs`
   - Replace `YOUR_FIREBASE_DATABASE_SECRET` (line 15) with your actual secret
   - Save and deploy as Web App
4. **Update Frontend URLs:**
   - Replace URL in `public/js/admin.js` (line 4)
   - Replace URL in `public/js/sidebar.js` (line 88)
   - With your new deployment URL
5. **Test & Activate:**
   - Run `testSync` function
   - Run `setupTriggers` function
   - Verify data appears in Firebase

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────┐
│         GOOGLE SHEETS                   │
│  ┌─────────────────────────────────┐   │
│  │ Sheet 1: "Sales"                │   │
│  │  - Team                         │   │
│  │  - Product                      │   │
│  │  - Amount                       │   │
│  │  - Date                         │   │
│  │  - Payment ID                   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Sheet 2: "Teams"                │   │
│  │  - Team Name                    │   │
│  │  - Members                      │   │
│  │  - Group                        │   │
│  │  - Product Name                 │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Sheet 3: "Access" (Optional)    │   │
│  │  - Email                        │   │
│  │  - Access Level                 │   │
│  └─────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │
                 ▼ (Every 5 minutes)
┌─────────────────────────────────────────┐
│     GOOGLE APPS SCRIPT (Code.gs)        │
│  ┌─────────────────────────────────┐   │
│  │ 1. Read sales from Sheets       │   │
│  │ 2. Group by team                │   │
│  │ 3. Calculate totals & ranks     │   │
│  │ 4. Detect trends (up/down)      │   │
│  │ 5. Process metadata             │   │
│  └─────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │
                 ▼ (Firebase REST API)
┌─────────────────────────────────────────┐
│    FIREBASE REALTIME DATABASE           │
│  ┌─────────────────────────────────┐   │
│  │ /sparkTank/                     │   │
│  │   leaderboard: [...]            │   │
│  │   recentTransactions: [...]     │   │
│  │   metadata: {...}               │   │
│  │   lastSync: "timestamp"         │   │
│  └─────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │
                 ▼ (Real-time listeners)
┌─────────────────────────────────────────┐
│         WEB DASHBOARD                   │
│  ┌─────────────────────────────────┐   │
│  │ Stats Cards                     │   │
│  │  - Total Sales                  │   │
│  │  - Total Orders                 │   │
│  │  - Active Teams                 │   │
│  │  - Avg Order Value              │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Leaderboard                     │   │
│  │  🥇 Team Gamma - ₹9,500         │   │
│  │  🥈 Team Alpha - ₹9,400         │   │
│  │  🥉 Team Beta - ₹7,200          │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Recent Transactions             │   │
│  │  Team Alpha: ₹2,500             │   │
│  │  Team Beta: ₹3,000              │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 📁 File Structure

```
Scaler Spark Tank project/
│
├── google-apps-script/          ← START HERE
│   ├── README.md               ← Overview and reference
│   ├── QUICKSTART.md           ← 5-minute setup guide ⭐
│   ├── SETUP.md                ← Detailed setup instructions
│   ├── SHEETS-TEMPLATE.md      ← Google Sheets structure
│   └── Code.gs                 ← Complete sync script
│
├── public/
│   ├── dashboard.html          ← Main dashboard (redesigned)
│   ├── admin.html              ← Admin panel
│   ├── live-dashboard.html     ← Fullscreen leaderboard
│   │
│   ├── css/
│   │   ├── styles.css          ← Main styles
│   │   └── sidebar.css         ← Shadcn sidebar styles
│   │
│   └── js/
│       ├── firebase-config.js  ← Firebase connection
│       ├── dashboard.js        ← Dashboard logic
│       ├── sidebar.js          ← Sidebar & sync logic
│       └── admin.js            ← Admin panel logic
│
└── SYNC-SETUP-STATUS.md        ← This file
```

---

## 🔑 Configuration Required

### **1. Firebase Database Secret**

**Location:** `google-apps-script/Code.gs` line 15

**Current:**
```javascript
const FIREBASE_SECRET = "YOUR_FIREBASE_DATABASE_SECRET"; // ⚠️ REPLACE THIS
```

**Get it from:**
1. [Firebase Console](https://console.firebase.google.com)
2. Select project: `scaler-spark-tank`
3. ⚙️ Settings → Project Settings
4. Service Accounts tab
5. Database Secrets → Show

**Replace with:**
```javascript
const FIREBASE_SECRET = "abc123xyz..."; // Your actual secret
```

### **2. Apps Script Deployment** (If creating new)

**Current working URL:**
```
https://script.google.com/macros/s/AKfycbwsQOwiJp9Wv-QVPB_9GWGz2mf4a-L2ibrdEisFIaO8fh8lADq3C2sKd9EnWmonXR3B/exec
```

**Status:** ✅ Online (responds with "Scaler Spark Tank Backend is running")

**If you need to create a new deployment:**
- Follow `google-apps-script/QUICKSTART.md`
- Update URLs in `public/js/admin.js` (line 4)
- Update URLs in `public/js/sidebar.js` (line 88)

---

## 🧪 Testing Checklist

Once configured, verify these work:

### **Apps Script Tests**

- [ ] Open Google Apps Script editor
- [ ] Select function: `testSync`
- [ ] Click Run ▶️
- [ ] Check Execution log shows: "✅ Sync completed"
- [ ] Select function: `setupTriggers`
- [ ] Click Run ▶️
- [ ] Verify trigger created (⏰ Triggers sidebar)

### **Firebase Tests**

- [ ] Open [Firebase Console](https://console.firebase.google.com)
- [ ] Go to: Realtime Database → Data
- [ ] Check path: `/sparkTank/leaderboard` exists
- [ ] Check path: `/sparkTank/recentTransactions` exists
- [ ] Check path: `/sparkTank/metadata` exists
- [ ] Verify data is populated with teams

### **Dashboard Tests**

- [ ] Open: `http://localhost:5080/dashboard.html`
- [ ] Sign in with Google
- [ ] Stats cards show numbers (not ₹0)
- [ ] Leaderboard displays teams with rankings
- [ ] Recent transactions appear
- [ ] Click "Sync Now" in sidebar
- [ ] Verify "✅ Sync successful!" notification
- [ ] Data updates in real-time

---

## 📊 Expected Data in Firebase

After first sync, Firebase should contain:

### **/sparkTank/leaderboard**
```json
[
  {
    "rank": 1,
    "teamName": "Team Alpha",
    "group": "A",
    "members": ["John Doe", "Jane Smith"],
    "productName": "Premium Package",
    "totalSales": 25000,
    "transactionCount": 10,
    "avgOrderValue": 2500,
    "trend": "up"
  },
  ...
]
```

### **/sparkTank/recentTransactions**
```json
[
  {
    "teamName": "Team Alpha",
    "amount": 2500,
    "timestamp": "2025-01-10T10:30:00Z",
    "paymentId": "PAY_001",
    "productName": "Premium Package"
  },
  ...
]
```

### **/sparkTank/metadata**
```json
{
  "totalSales": 150000,
  "totalOrders": 45,
  "totalTeams": 8,
  "lastUpdated": "2025-01-10T10:30:00Z"
}
```

---

## 🎯 Quick Start Guide

### **Fastest Path to Success:**

1. **Open** `google-apps-script/QUICKSTART.md`
2. **Follow** the 6 steps (takes ~5 minutes)
3. **Test** with `testSync` function
4. **Activate** with `setupTriggers` function
5. **Verify** data appears in dashboard

### **Need Help?**

- **Quick questions:** Check `google-apps-script/README.md`
- **Setup issues:** See `google-apps-script/SETUP.md` troubleshooting section
- **Data structure:** Reference `google-apps-script/SHEETS-TEMPLATE.md`

---

## 🔐 Security Reminders

⚠️ **Important:**
- Never commit Firebase secret to Git
- Keep Apps Script code with secret private
- Use Firebase Database Rules to restrict access
- Only share deployment URLs, not script code

✅ **Recommended Firebase Rules:**
```json
{
  "rules": {
    "sparkTank": {
      ".read": "auth != null",
      ".write": false
    }
  }
}
```

This allows:
- ✅ Apps Script writes (using database secret)
- ✅ Authenticated users read (via dashboard)
- ❌ Public cannot access data

---

## 🚀 Next Steps

1. **Choose your path:**
   - Using existing deployment? → Skip to verification
   - Creating new deployment? → Follow QUICKSTART.md

2. **Get Firebase secret:**
   - Firebase Console → Project Settings → Database Secrets

3. **Configure Code.gs:**
   - Replace `YOUR_FIREBASE_DATABASE_SECRET` with actual secret

4. **Test sync:**
   - Run `testSync` function
   - Verify data appears in Firebase

5. **Activate auto-sync:**
   - Run `setupTriggers` function
   - Confirm trigger in ⏰ Triggers section

6. **Enjoy real-time leaderboard!** 🎉

---

## 📞 Support

**Documentation:**
- `google-apps-script/QUICKSTART.md` - Fast setup
- `google-apps-script/SETUP.md` - Detailed guide
- `google-apps-script/README.md` - Reference
- `google-apps-script/SHEETS-TEMPLATE.md` - Data structure

**Troubleshooting:**
- Apps Script execution logs (View → Logs)
- Firebase Console (Database → Data)
- Browser console (F12 on dashboard)

---

**Status:** ✅ Ready to configure and deploy!

**Last Updated:** October 9, 2025

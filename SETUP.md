# 🔧 Scaler Spark Tank - Complete Setup Guide

This guide will walk you through setting up the entire Scaler Spark Tank Live Leaderboard system from scratch.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
3. [Google Sheets Preparation](#google-sheets-preparation)
4. [Google Apps Script Setup](#google-apps-script-setup)
5. [Frontend Configuration](#frontend-configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Google Account** with access to Google Sheets and Apps Script
- ✅ **Firebase Project** created (or admin access to create one)
- ✅ **Node.js** installed (v14 or higher)
- ✅ **Git** installed (optional, for version control)
- ✅ **Text Editor** (VS Code recommended)
- ✅ **Google Sheets** with MasterData, Razorpay_Payments, and Access sheets

---

## 🔥 Firebase Setup

### Step 1: Create Firebase Project (if not exists)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or use existing project `scaler-spark-tank`
3. Project name: `scaler-spark-tank`
4. Enable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Enable Firebase Services

#### A. Enable Google Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Google**
3. Toggle **Enable**
4. Add authorized domain: `sst.scaler.com` (if using custom domain)
5. Save

#### B. Create Realtime Database

1. Go to **Realtime Database** → **Create Database**
2. Select location: **United States** (or closest to your users)
3. Start in **Test Mode** (we'll update rules later)
4. Click **Enable**

#### C. Set Up Hosting

1. Go to **Hosting** → **Get Started**
2. Follow the setup wizard
3. Note your hosting URL (e.g., `scaler-spark-tank.web.app`)

### Step 3: Configure Database Rules

1. Go to **Realtime Database** → **Rules**
2. Replace with the following rules:

```json
{
  "rules": {
    "sparkTank": {
      ".read": "auth != null",
      ".write": false,
      "leaderboard": {
        ".indexOn": ["rank", "totalSales"]
      },
      "recentTransactions": {
        ".indexOn": ["timestamp"]
      }
    },
    "access": {
      ".read": "auth != null",
      ".write": false
    },
    "adminControl": {
      ".read": "auth != null && auth.token.email == 'sparktank@ssb.scaler.com'",
      ".write": "auth != null && auth.token.email == 'sparktank@ssb.scaler.com'"
    }
  }
}
```

3. Click **Publish**

### Step 4: Get Firebase Configuration

1. Go to **Project Settings** (gear icon) → **General**
2. Scroll to **Your apps** → **Web app**
3. Click **Add app** (</> icon) if not created
4. Register app name: `Spark Tank Dashboard`
5. Copy the Firebase configuration object
6. Update in `public/js/firebase-config.js` if needed

### Step 5: Get Database URL

1. Go to **Realtime Database**
2. Copy the database URL (e.g., `https://scaler-spark-tank-default-rtdb.firebaseio.com`)
3. Update in:
   - `Backend_Firebase.js` (line 81)
   - `public/js/firebase-config.js` (add `databaseURL` field)

---

## 📊 Google Sheets Preparation

### Sheet Structure

Your Google Sheet should have 3 sheets:

#### 1. MasterData Sheet

| Group | Product/Service Name | Name1 | Email1 | Name2 | Email2 | ... | Razorpay ID | Pass | Account ID | Account Name | Account Email | Webhook Secret |
|-------|---------------------|-------|--------|-------|--------|-----|-------------|------|------------|--------------|---------------|----------------|
| Group 1 | Chatori Snacks | Tirthrajsinh | tirthrajsinh.25045@ssb.scaler.com | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Columns:**
- Group (Required)
- Product/Service Name (Required)
- Name1, Email1, Name2, Email2, ... Name5, Email5 (5 members max)
- Razorpay ID
- Pass
- Account ID (Required for matching payments)
- Account Name
- Account Email (Required for matching payments)
- Webhook Secret

#### 2. Razorpay_Payments Sheet

| Timestamp | Event Type | Entity Type | Entity ID | Order ID | Amount | Currency | Customer Email | Customer Name | Status | Notes | Extra ID | Razorpay Account ID | Razorpay Account Email |
|-----------|------------|-------------|-----------|----------|--------|----------|----------------|---------------|--------|-------|----------|---------------------|------------------------|
| 2025-10-08 10:30 | payment.captured | payment | pay_xxx | order_xxx | 35000 | INR | customer@email.com | John Doe | captured | | | acc_xxx | team1@gmail.com |

**Important:**
- **Amount**: In paise (100 paise = 1 rupee). The script automatically converts.
- **Status**: Must be `captured`, `success`, or `paid` to be counted
- **Razorpay Account Email** or **Razorpay Account ID**: Must match MasterData for team attribution

#### 3. Access Sheet

| Email | Name | Access Type | Group |
|-------|------|-------------|-------|
| sparktank@ssb.scaler.com | SPARK | Admin | |
| student1@ssb.scaler.com | Student Name | Student | Group 1 |

**Access Types:**
- **Admin**: Full access to admin panel
- **Student**: View-only access to leaderboard

### Get Sheet ID

1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Copy the `SHEET_ID`
4. Update in `Backend_Firebase.js` (line 13)

---

## ⚙️ Google Apps Script Setup

### Step 1: Create Apps Script Project

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Delete the default `myFunction()`
4. Copy **ALL** code from `Backend_Firebase.js`
5. Paste into Apps Script editor
6. Rename project to "Scaler Spark Tank Backend"
7. Click **Save** (💾 icon)

### Step 2: Set Up Script Properties (Optional - for Firebase Auth)

If using Firebase Database Secret:

1. In Apps Script, click **Project Settings** (⚙️ icon)
2. Scroll to **Script Properties**
3. Click **Add script property**
   - Property: `FIREBASE_SECRET`
   - Value: Your Firebase database secret (from Firebase Console → Project Settings → Service Accounts)

**Note:** For initial testing, you can use Firebase Database in Test Mode without authentication.

### Step 3: Test the Sync Function

1. In Apps Script editor, select function: `testSync`
2. Click **Run** (▶️ icon)
3. First run will ask for permissions:
   - Review permissions
   - Click **Advanced** → **Go to Scaler Spark Tank Backend**
   - Click **Allow**
4. Check **Execution log** (bottom of screen)
5. You should see:
   ```
   === Testing Sync ===
   Master Data: 3 teams
   Payments Data: X payments
   Leaderboard: [...]
   ✅ Sync completed successfully
   ```

6. **Verify in Firebase:**
   - Go to Firebase Console → Realtime Database
   - You should see `sparkTank` node with `leaderboard`, `recentTransactions`, `lastSync`, `metadata`

### Step 4: Set Up Automatic Sync (Time-Driven Trigger)

1. In Apps Script editor, select function: `setupTimeDrivenTrigger`
2. Click **Run** (▶️ icon)
3. Grant permissions if asked
4. Check execution log: `✅ Time-driven trigger set up successfully`

**Verify Trigger:**
1. Click **Triggers** (⏰ icon) in left sidebar
2. You should see: `syncToFirebase` running every 5 minutes

**Adjust Sync Frequency (Optional):**
Edit line 458-460 in `Backend_Firebase.js`:
```javascript
ScriptApp.newTrigger('syncToFirebase')
  .timeBased()
  .everyMinutes(1)  // Change to 1, 5, 10, 15, or 30
  .create();
```

### Step 5: Deploy as Web App (for Admin Panel Manual Sync)

1. Click **Deploy** → **New deployment**
2. Click **⚙️ Select type** → **Web app**
3. Configuration:
   - Description: "Spark Tank API v1"
   - Execute as: **Me** (your email)
   - Who has access: **Anyone** (or **Anyone with Google account**)
4. Click **Deploy**
5. Copy the **Web App URL**
6. Update in `public/js/admin.js` (line 3):
   ```javascript
   const APPS_SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE';
   ```

---

## 🌐 Frontend Configuration

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

Follow the browser prompts to authenticate.

### Step 3: Initialize Firebase Project

```bash
cd "Scaler Spark Tank project"
firebase init
```

**Select:**
- ☑️  Hosting
- ☑️  Realtime Database

**Configuration:**
- Use existing project: `scaler-spark-tank`
- Database rules file: `database.rules.json`
- Public directory: `public`
- Configure as SPA: **No**
- Automatic builds: **No**
- Overwrite files: **No**

### Step 4: Verify Configuration Files

Check that these files exist:
- ✅ `firebase.json`
- ✅ `.firebaserc`
- ✅ `database.rules.json`

### Step 5: Update Firebase Config (if needed)

Edit `public/js/firebase-config.js` and ensure values match your Firebase project.

---

## 🧪 Testing

### Local Testing

1. **Start Firebase Emulator:**
   ```bash
   firebase serve
   ```

2. **Open in browser:**
   ```
   http://localhost:5000
   ```

3. **Test Features:**
   - ✅ Login with Google (@ssb.scaler.com email)
   - ✅ View leaderboard
   - ✅ Check real-time updates
   - ✅ Admin panel (with admin email)
   - ✅ Manual sync

### Production Testing

1. **Deploy to Firebase:**
   ```bash
   firebase deploy
   ```

2. **Open deployed URL:**
   ```
   https://scaler-spark-tank.web.app
   ```

3. **Test all features in production**

### Test Checklist

- [ ] Google Sign-In works
- [ ] Access control (admin vs student)
- [ ] Leaderboard displays correctly
- [ ] Real-time updates (add a test payment in Sheets)
- [ ] Sale celebration animation triggers
- [ ] Recent transactions ticker scrolls
- [ ] Admin panel shows statistics
- [ ] Manual sync button works
- [ ] Export to CSV works
- [ ] Mobile responsive layout
- [ ] Fullscreen mode (F11)

---

## 🔍 Troubleshooting

### Issue: "Access Denied" on login

**Solution:**
1. Check if user email is in Access sheet
2. Verify email domain is @ssb.scaler.com
3. Clear browser cache and retry

### Issue: Leaderboard not updating

**Solution:**
1. Go to Apps Script → Triggers
2. Verify `syncToFirebase` trigger is active
3. Check Apps Script execution logs for errors
4. Manually run `syncToFirebase` function
5. Check Firebase Realtime Database for data

### Issue: Firebase permission denied

**Solution:**
1. Check Firebase Database Rules
2. Ensure user is authenticated
3. Verify `.read` and `.write` rules
4. Check browser console for specific error

### Issue: Google Apps Script errors

**Common errors:**
- **"Sheet not found"**: Check sheet names match exactly (case-sensitive)
- **"Cannot read property"**: Check column headers match exactly
- **"Exceeded maximum execution time"**: Reduce data size or optimize script

### Issue: Payments not matching teams

**Solution:**
1. Verify `Razorpay Account Email` or `Razorpay Account ID` in Payments sheet
2. Ensure they match values in MasterData sheet (exact match, case-sensitive)
3. Check payment status is "captured", "success", or "paid"

---

## 🎉 Next Steps

Once setup is complete:

1. ✅ Test with real data
2. ✅ Train students on how to view dashboard
3. ✅ Set up classroom projector display
4. ✅ Monitor admin panel during competition
5. ✅ Celebrate awesome sales with confetti! 🎊

---

## 📞 Support

For additional help:
- Check main README.md
- Check DEPLOYMENT.md for deployment details
- Contact: sparktank@ssb.scaler.com

---

**Setup completed! 🚀 Ready for Spark Tank 2025!**

# 🚀 Deployment Guide - Scaler Spark Tank

This guide covers deploying the Spark Tank Live Leaderboard to production and maintaining it during the competition.

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Steps](#deployment-steps)
3. [Post-Deployment Verification](#post-deployment-verification)
4. [Competition Day Setup](#competition-day-setup)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Common Issues](#common-issues)

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure:

### Firebase Setup
- [ ] Firebase project created and configured
- [ ] Realtime Database created with proper rules
- [ ] Google Authentication enabled
- [ ] Hosting initialized
- [ ] Database rules published

### Google Sheets
- [ ] MasterData sheet filled with all teams
- [ ] Razorpay_Payments sheet ready (can be empty initially)
- [ ] Access sheet contains all authorized users
- [ ] Sheet ID copied and updated in Backend_Firebase.js

### Google Apps Script
- [ ] Code deployed to Apps Script
- [ ] `testSync` function tested successfully
- [ ] Time-driven trigger set up (every 5 minutes)
- [ ] Deployed as Web App
- [ ] Web App URL copied to admin.js

### Frontend Files
- [ ] Firebase config updated in firebase-config.js
- [ ] Apps Script URL updated in admin.js
- [ ] All HTML/CSS/JS files in `public/` folder
- [ ] Firebase CLI installed and logged in

### Testing
- [ ] Local testing completed (`firebase serve`)
- [ ] All features tested and working
- [ ] Mobile responsive verified
- [ ] Access control tested (admin + student)

---

## 🚀 Deployment Steps

### Step 1: Final Configuration Check

1. **Verify Firebase Config** (`public/js/firebase-config.js`):
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyBbRhFAMsAkFjV8M1bttbDouP0MdSLg3C8",
     authDomain: "sst.scaler.com", // or "scaler-spark-tank.firebaseapp.com"
     projectId: "scaler-spark-tank",
     storageBucket: "scaler-spark-tank.appspot.com",
     messagingSenderId: "88572481923",
     appId: "1:88572481923:web:22b57173f6c10bfb55e6b6",
     databaseURL: "https://scaler-spark-tank-default-rtdb.firebaseio.com"
   };
   ```

2. **Verify Apps Script URL** (`public/js/admin.js` line 3):
   ```javascript
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
   ```

3. **Check Database Rules** (`database.rules.json`):
   - Ensure `.read` requires authentication
   - Ensure `.write` is false (only Apps Script can write)

### Step 2: Deploy to Firebase

```bash
# Navigate to project directory
cd "Scaler Spark Tank project"

# Deploy database rules
firebase deploy --only database

# Deploy hosting
firebase deploy --only hosting
```

**Expected Output:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/scaler-spark-tank/overview
Hosting URL: https://scaler-spark-tank.web.app
```

### Step 3: Deploy Database Rules

If you need to update rules separately:

```bash
firebase deploy --only database
```

### Step 4: Custom Domain Setup (Optional)

If using custom domain `sst.scaler.com`:

1. **Add Custom Domain:**
   ```bash
   firebase hosting:channel:deploy live --only hosting
   ```

2. **In Firebase Console:**
   - Go to Hosting → Add custom domain
   - Enter: `sst.scaler.com`
   - Follow DNS configuration instructions
   - Add TXT and A records to your domain registrar

3. **Update Firebase Config:**
   - Change `authDomain` to `sst.scaler.com`
   - Redeploy: `firebase deploy --only hosting`

---

## ✅ Post-Deployment Verification

### 1. Test Live URL

1. **Open in browser:**
   ```
   https://scaler-spark-tank.web.app
   ```

2. **Test login:**
   - Sign in with authorized @ssb.scaler.com email
   - Verify redirect to dashboard

3. **Test dashboard:**
   - Check if leaderboard loads
   - Verify real-time updates (check timestamp)
   - Check recent transactions ticker

4. **Test admin panel:**
   - Login with `sparktank@ssb.scaler.com`
   - Verify admin panel access
   - Test manual sync button
   - Test export to CSV

### 2. Verify Data Sync

1. **Add test payment** in Google Sheets:
   - Go to Razorpay_Payments sheet
   - Add a row with test data
   - Ensure Status = "captured"
   - Ensure Razorpay Account Email matches a team in MasterData

2. **Wait 5 minutes** (or trigger manual sync)

3. **Check dashboard:**
   - Should see updated sales amount
   - Should see celebration animation (if new sale)
   - Should see transaction in ticker

### 3. Performance Check

1. **Test on different devices:**
   - Desktop (Chrome, Firefox, Safari)
   - Tablet
   - Mobile phone

2. **Check load time:**
   - Should load within 2-3 seconds
   - Check Network tab in DevTools

3. **Test real-time updates:**
   - Open in two browsers
   - Update data in Sheets
   - Both should update within 5 minutes

---

## 🎓 Competition Day Setup

### Morning Setup (Before Competition)

1. **Verify all systems:**
   ```bash
   # Check if site is live
   curl https://scaler-spark-tank.web.app

   # Check Apps Script trigger
   # Go to Apps Script → Triggers → Verify last execution time
   ```

2. **Clear test data:**
   - Remove test payments from Sheets
   - Reset all team sales to 0 (if needed)
   - Trigger manual sync to clear leaderboard

3. **Classroom setup:**
   - Connect laptop to projector
   - Open dashboard in fullscreen (press F11)
   - Position for optimal visibility
   - Test brightness/contrast

4. **Set shorter sync interval (Optional):**
   - For more frequent updates during competition
   - Edit Apps Script trigger to every 1 minute
   - Or have admin manually sync periodically

### During Competition

1. **Keep admin panel open** on separate device:
   - Monitor statistics
   - Watch for sync errors
   - Trigger manual sync if needed

2. **Display dashboard** on projector:
   - Keep in fullscreen mode
   - Ensure auto-lock is disabled on laptop
   - Keep charger connected

3. **Monitor for issues:**
   - Check Firebase Console for errors
   - Check Apps Script execution logs
   - Verify data is syncing every 5 minutes

### Celebration Mode

When sales happen:
- 🎉 Confetti animation automatically triggers
- 💰 Banner shows team name and sale amount
- 📊 Leaderboard updates with smooth animation
- 🎵 Optional: Add sound effects (in code)

---

## 📊 Monitoring & Maintenance

### Firebase Console Monitoring

1. **Realtime Database:**
   - Check data updates in real-time
   - Monitor read/write operations
   - Check for errors

2. **Authentication:**
   - View active users
   - Check sign-in methods

3. **Hosting:**
   - Monitor bandwidth usage
   - Check request count

### Google Apps Script Monitoring

1. **Execution Logs:**
   - Apps Script → Executions
   - Check for errors or warnings
   - Verify sync completion times

2. **Triggers:**
   - Ensure trigger is running
   - Check last execution time
   - Look for failures

### Health Check Endpoints

1. **Test Apps Script status:**
   ```bash
   curl "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=status"
   ```

   Expected response:
   ```json
   {
     "status": "online",
     "timestamp": "2025-10-08T10:30:00.000Z",
     "message": "Scaler Spark Tank Backend is running"
   }
   ```

---

## 🐛 Common Issues

### Issue: Dashboard not updating

**Diagnosis:**
1. Check Apps Script execution logs
2. Check Firebase Realtime Database for recent updates
3. Check browser console for errors

**Solution:**
1. Trigger manual sync from admin panel
2. If trigger failed, manually run `syncToFirebase` in Apps Script
3. Check for quota limits (Apps Script has daily limits)

### Issue: Authentication failing

**Solution:**
1. Check Firebase Authentication is enabled
2. Verify domain is authorized in Firebase Console
3. Clear browser cookies and cache
4. Check if email is in Access sheet

### Issue: Slow performance

**Solution:**
1. Check Firebase usage (may be throttled)
2. Reduce sync frequency if too high
3. Optimize queries (add indexes in database rules)
4. Check internet connection speed

### Issue: Celebration not triggering

**Possible causes:**
1. First load (no previous data to compare)
2. Amount didn't change (duplicate sync)
3. Page not in focus (animations may be throttled)

**Solution:**
1. Add a test payment and wait for next sync
2. Ensure tab is visible and active

### Issue: Data mismatch

**Solution:**
1. Verify Sheet ID in Apps Script
2. Check column headers match exactly (case-sensitive)
3. Ensure Razorpay Account Email matches between sheets
4. Check payment Status is "captured", "success", or "paid"

---

## 🔄 Rolling Back Deployment

If something goes wrong:

```bash
# List previous deployments
firebase hosting:sites:list

# Rollback to previous version
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL TARGET_SITE_ID:live
```

---

## 📈 Scaling Considerations

For larger competitions:

1. **Increase sync frequency:**
   - Change trigger to every 1 minute
   - Watch for Apps Script quota limits

2. **Add caching:**
   - Cache leaderboard data on frontend
   - Reduce Firebase reads

3. **Optimize queries:**
   - Add database indexes
   - Limit transaction history to recent items

4. **Use Cloud Functions** (Advanced):
   - Replace Apps Script with Firebase Cloud Functions
   - Better performance and reliability
   - More flexible triggers

---

## 🎯 Post-Competition

After the competition:

1. **Export final data:**
   - Use admin panel "Export to CSV"
   - Download from Firebase Console
   - Backup Google Sheets

2. **Disable triggers:**
   - Run `removeAllTriggers()` in Apps Script
   - Saves quota for next use

3. **Archive project:**
   - Keep Firebase project active (free tier)
   - Document any custom changes
   - Save credentials securely

---

## 📞 Emergency Contacts

During competition:

- **Firebase Console**: https://console.firebase.google.com/
- **Apps Script**: https://script.google.com/
- **Admin Email**: sparktank@ssb.scaler.com
- **Support**: Check logs first, then contact admin

---

## 🎉 Success Metrics

A successful deployment means:

- ✅ Real-time updates within 5 minutes
- ✅ Zero downtime during competition
- ✅ All users can access dashboard
- ✅ Celebrations trigger on new sales
- ✅ Admin panel works for monitoring
- ✅ Data accuracy (matches Google Sheets)
- ✅ Smooth, impressive display on projector

---

**Ready to go live! 🚀 Good luck with Spark Tank 2025!**

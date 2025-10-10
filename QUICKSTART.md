# ⚡ Quick Start Guide - Scaler Spark Tank

Fast reference for getting the dashboard running quickly.

## 🚀 Deploy in 5 Minutes

### 1. Configure Backend

```bash
# Open Google Sheet
# Go to Extensions → Apps Script
# Paste code from Backend_Firebase.js
# Run: setupTimeDrivenTrigger()
```

### 2. Deploy Frontend

```bash
cd "Scaler Spark Tank project"
firebase login
firebase deploy
```

### 3. Access Dashboard

**Main Dashboard:**
```
https://scaler-spark-tank.web.app
```

**Admin Panel:**
```
https://scaler-spark-tank.web.app/admin.html
```

---

## 🔑 Login Credentials

### Admin Access
- Email: `sparktank@ssb.scaler.com`
- Access: Full admin panel + dashboard

### Student Access
- Email: Any `@ssb.scaler.com` in Access sheet
- Access: Dashboard only (read-only)

---

## 📊 Key URLs

| Resource | URL |
|----------|-----|
| **Live Dashboard** | https://scaler-spark-tank.web.app |
| **Admin Panel** | https://scaler-spark-tank.web.app/admin.html |
| **Firebase Console** | https://console.firebase.google.com/project/scaler-spark-tank |
| **Google Sheet** | https://docs.google.com/spreadsheets/d/1QStnIu1GxQrO7vzZDb57lmkqb3N6fXex3TUW |
| **Apps Script** | Extensions → Apps Script (from Sheet) |

---

## ⚙️ Essential Commands

### Deploy
```bash
firebase deploy                    # Deploy everything
firebase deploy --only hosting     # Deploy frontend only
firebase deploy --only database    # Deploy database rules only
```

### Local Testing
```bash
firebase serve                     # Test locally at localhost:5000
```

### View Logs
```bash
firebase functions:log            # View function logs (if using)
```

---

## 🔧 Quick Fixes

### Dashboard not updating?
```bash
# 1. Check Apps Script trigger
# 2. Manually run syncToFirebase()
# 3. Check Firebase Console for data
```

### Can't login?
```bash
# 1. Clear browser cache
# 2. Check email in Access sheet
# 3. Verify Firebase Auth is enabled
```

### Manual sync from Admin Panel
```bash
# 1. Login to admin panel
# 2. Click "Manual Sync Now"
# 3. Wait for success message
```

---

## 📱 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **F11** | Toggle fullscreen |
| **R** | Reload dashboard |
| **Ctrl+Shift+I** | Open DevTools (debug) |

---

## 🎯 Competition Day Checklist

### Before Competition
- [ ] Verify Apps Script trigger is running
- [ ] Test dashboard on projector
- [ ] Clear test data from Google Sheets
- [ ] Login to admin panel on separate device
- [ ] Set laptop to never sleep
- [ ] Connect charger

### During Competition
- [ ] Dashboard open in fullscreen on projector
- [ ] Admin panel open on laptop/tablet
- [ ] Monitor for sync errors
- [ ] Trigger manual sync if needed
- [ ] Celebrate sales! 🎉

### After Competition
- [ ] Export data to CSV
- [ ] Take screenshots of final leaderboard
- [ ] Disable Apps Script trigger
- [ ] Backup Google Sheet

---

## 🐛 Emergency Troubleshooting

### Apps Script Error
1. Open Apps Script
2. Click **Executions** (left sidebar)
3. Find the error
4. Fix and re-run `syncToFirebase()`

### Firebase Error
1. Open Firebase Console
2. Check Realtime Database → Data
3. Check Authentication → Users
4. Check Hosting → Dashboard

### Frontend Error
1. Press **F12** (DevTools)
2. Check **Console** tab for errors
3. Check **Network** tab for failed requests

---

## 📞 Quick Help

**For detailed help, see:**
- `README.md` - Project overview
- `SETUP.md` - Complete setup guide
- `DEPLOYMENT.md` - Deployment details

**Contact:**
- Email: sparktank@ssb.scaler.com

---

## 🎨 Customization Quick Tips

### Change Sync Frequency
Edit `Backend_Firebase.js` line 458:
```javascript
.everyMinutes(5)  // Change to 1, 10, 15, 30
```

### Change Color Scheme
Edit `public/css/styles.css` lines 6-9:
```css
--color-purple: #8B5CF6;   /* Change hex code */
--color-pink: #EC4899;
--color-orange: #F97316;
```

### Disable Celebrations
Edit `public/js/dashboard.js` line 68:
```javascript
// Comment out this line:
// celebrateNewSale(newTeam.teamName, saleAmount);
```

---

**That's it! You're ready to rock Spark Tank 2025! 🚀**

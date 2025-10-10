# 🚀 Scaler Spark Tank 2025 - Live Leaderboard

A stunning, production-ready real-time leaderboard for the Scaler Spark Tank dropshipping competition. Features live sales tracking, celebratory animations, and a beautiful gradient-based design optimized for classroom projection.

![Scaler Spark Tank](https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/090/511/original/Copy_of_Logo-White.png?1727164234)

## 🌟 Features

### For Students
- **Real-time Leaderboard**: Live updates every 1-5 minutes from Google Sheets
- **Stunning Visuals**: Dark theme with purple-pink-orange gradients and glassmorphism effects
- **Sale Celebrations**: Confetti animations and celebratory effects when new sales occur
- **Recent Transactions Feed**: Scrolling ticker showing latest sales across all teams
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Google Sign-In**: Secure authentication with @ssb.scaler.com emails

### For Admins
- **Admin Panel**: Full control dashboard with statistics and controls
- **Manual Sync**: Trigger data sync from Google Sheets on demand
- **Data Export**: Export leaderboard to CSV
- **Transaction Logs**: View all recent transactions in detail
- **Real-time Stats**: Total sales, orders, and team performance metrics

### For Classroom Display
- **Large Text**: Optimized for reading from across the room
- **Auto-refresh**: Continuous real-time updates without manual intervention
- **Fullscreen Mode**: Press F11 for distraction-free display
- **Visual Hierarchy**: Top 3 teams highlighted with gold, silver, bronze effects

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Hosting**: Firebase Hosting
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Google Auth
- **Backend**: Google Apps Script
- **Data Source**: Google Sheets
- **Design**: Inter font, CSS animations, glassmorphism

## 📁 Project Structure

```
scaler-spark-tank/
├── public/
│   ├── index.html              # Login page
│   ├── dashboard.html          # Main leaderboard
│   ├── admin.html              # Admin panel
│   ├── css/
│   │   └── styles.css          # Global styles & animations
│   └── js/
│       ├── firebase-config.js  # Firebase configuration
│       ├── dashboard.js        # Leaderboard logic
│       └── admin.js            # Admin panel logic
├── Backend_Firebase.js         # Google Apps Script sync code
├── firebase.json               # Firebase hosting config
├── .firebaserc                 # Firebase project config
├── database.rules.json         # Database security rules
├── README.md                   # This file
├── SETUP.md                    # Detailed setup instructions
└── DEPLOYMENT.md               # Deployment guide
```

## 🚀 Quick Start

### Prerequisites
- Google Account with access to the Google Sheet
- Firebase project created
- Node.js installed (for Firebase CLI)

### 1. Clone & Install
```bash
cd "Scaler Spark Tank project"
npm install -g firebase-tools
```

### 2. Configure Firebase
```bash
firebase login
firebase init
```
Select:
- ✅ Hosting
- ✅ Realtime Database
- Choose existing project: `scaler-spark-tank`
- Public directory: `public`

### 3. Set Up Google Apps Script
1. Open your Google Sheet
2. Go to Extensions → Apps Script
3. Paste the code from `Backend_Firebase.js`
4. Run `setupTimeDrivenTrigger()` to enable auto-sync every 5 minutes
5. Deploy as Web App (for manual sync from admin panel)

### 4. Configure Firebase Database Rules
1. Go to Firebase Console → Realtime Database → Rules
2. Copy content from `database.rules.json`
3. Publish rules

### 5. Deploy
```bash
firebase deploy
```

Your dashboard will be live at: `https://scaler-spark-tank.web.app`

## 🎨 Design Philosophy

The dashboard uses a **premium dark theme** with:
- **Flowing gradients**: Purple (#8B5CF6) → Pink (#EC4899) → Orange (#F97316)
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Animated orbs**: Floating gradient orbs in the background
- **Particle effects**: Twinkling stars for depth
- **Smooth animations**: Fade-ins, slides, and celebratory confetti

All design choices prioritize **readability from distance** for classroom projection.

## 🔐 Access Control

### Admin Access
- Email: `sparktank@ssb.scaler.com`
- Can access admin panel
- Can trigger manual sync
- Can export data

### Student Access
- Any `@ssb.scaler.com` email listed in the Access sheet
- View-only access to leaderboard
- Cannot modify data

## 📊 Data Flow

```
Google Sheets (Master Data + Payments)
           ↓
   Google Apps Script (Every 5 min)
           ↓
   Firebase Realtime Database
           ↓
   Frontend (Real-time listeners)
           ↓
   Beautiful Leaderboard Display
```

## 🎯 Key Pages

### Login Page (`/`)
- Animated gradient background
- Glass-morphic login card
- Google Sign-In button
- Particle effects

### Dashboard (`/dashboard.html`)
- Live leaderboard with rankings
- Team sales, orders, avg order value
- Trending indicators (📈/📉)
- Recent transactions ticker
- Sale celebration animations

### Admin Panel (`/admin.html`)
- Statistics overview
- Manual sync control
- Data tables (leaderboard, transactions)
- Export to CSV
- Sync logs

## 🔥 Firebase Services Used

1. **Hosting**: Serve static files
2. **Realtime Database**: Store & sync leaderboard data
3. **Authentication**: Google Sign-In

## 📱 Responsive Breakpoints

- **Desktop (1920px+)**: Full layout, large text for projection
- **Laptop (1024px-1919px)**: Optimized layout
- **Tablet (768px-1023px)**: Stacked cards
- **Mobile (<768px)**: Single column, touch-friendly

## ⚡ Performance Optimizations

- Minimal external dependencies
- CSS animations (hardware accelerated)
- Efficient Firebase listeners
- Cached assets
- Lazy loading

## 🐛 Troubleshooting

### Dashboard not updating?
1. Check Google Apps Script trigger is active
2. Verify Firebase database rules
3. Check browser console for errors

### Authentication errors?
1. Verify email is in Access sheet
2. Check Firebase Auth is enabled
3. Clear browser cache and retry

### Sync failures?
1. Check Google Apps Script logs
2. Verify Sheet ID is correct
3. Ensure Firebase database URL is correct

## 📄 License

This project is created for Scaler School of Business's Spark Tank competition.

## 🙋 Support

For issues or questions:
- Check `SETUP.md` for detailed setup instructions
- Check `DEPLOYMENT.md` for deployment guide
- Contact: sparktank@ssb.scaler.com

## 🎉 Credits

Built with ❤️ for Scaler Spark Tank 2025

---

**Made with Claude Code by Anthropic**

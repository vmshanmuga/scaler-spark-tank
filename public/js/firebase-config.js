// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBbRhFAMsAkFjV8M1bttbDouP0MdSLg3C8",
  authDomain: "scaler-spark-tank.firebaseapp.com",
  projectId: "scaler-spark-tank",
  storageBucket: "scaler-spark-tank.appspot.com",
  messagingSenderId: "88572481923",
  appId: "1:88572481923:web:22b57173f6c10bfb55e6b6",
  databaseURL: "https://scaler-spark-tank-default-rtdb.firebaseio.com"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Configure Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Check if user is admin (by checking Access Type in Firebase)
async function isAdmin(email) {
  try {
    // Check Access sheet in Firebase
    const snapshot = await database.ref('access').once('value');
    const accessList = snapshot.val();

    if (accessList) {
      const user = Object.values(accessList).find(user => user.Email === email);
      return user && user['Access Type'] === 'Admin';
    }

    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Check if user has access
async function checkUserAccess(email) {
  try {
    // All @ssb.scaler.com emails have access
    if (email.endsWith('@ssb.scaler.com')) {
      return true;
    }

    // Check Access sheet in Firebase
    const snapshot = await database.ref('access').once('value');
    const accessList = snapshot.val();

    if (accessList) {
      return Object.values(accessList).some(user => user.Email === email);
    }

    return false;
  } catch (error) {
    console.error('Error checking access:', error);
    return false;
  }
}

// Auth state observer
auth.onAuthStateChanged(async (user) => {
  if (user) {
    console.log('User signed in:', user.email);

    // Check access
    const hasAccess = await checkUserAccess(user.email);

    if (!hasAccess) {
      console.error('Access denied for:', user.email);
      showError('Access Denied', 'You do not have permission to view this dashboard. Please contact the administrator.');
      await auth.signOut();
      return;
    }

    // Check if user is admin
    const adminStatus = await isAdmin(user.email);

    // Store user info
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.displayName || 'User');
    localStorage.setItem('userPhoto', user.photoURL || '');
    localStorage.setItem('isAdmin', adminStatus);

  } else {
    console.log('User signed out');
    localStorage.clear();
  }
});

// Sign in with Google
async function signInWithGoogle() {
  try {
    const result = await auth.signInWithPopup(googleProvider);
    return result.user;
  } catch (error) {
    console.error('Sign-in error:', error);
    throw error;
  }
}

// Sign out
async function signOut() {
  try {
    await auth.signOut();
    localStorage.clear();
    window.location.href = '/index.html';
  } catch (error) {
    console.error('Sign-out error:', error);
  }
}

// Show error message (to be implemented in each page)
function showError(title, message) {
  if (typeof displayError === 'function') {
    displayError(title, message);
  } else {
    alert(`${title}: ${message}`);
  }
}

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBbRhFAMsAkFjV8M1bttbDouP0MdSLg3C8",
  authDomain: "scaler-spark-tank.firebaseapp.com",
  projectId: "scaler-spark-tank",
  storageBucket: "scaler-spark-tank.firebasestorage.app",
  messagingSenderId: "88572481923",
  appId: "1:88572481923:web:22b57173f6c10bfb55e6b6",
  measurementId: "G-NZG13L5QTE",
  databaseURL: "https://scaler-spark-tank-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

export default app;

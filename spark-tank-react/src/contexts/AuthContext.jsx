import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, database } from '../firebase/config';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { ref, get } from 'firebase/database';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userAccess, setUserAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Check user access from Firebase
  const checkUserAccess = async (email) => {
    try {
      const accessRef = ref(database, 'access');
      const snapshot = await get(accessRef);

      if (snapshot.exists()) {
        const accessData = snapshot.val();
        const accessList = Array.isArray(accessData) ? accessData : Object.values(accessData);

        const userAccessData = accessList.find(
          access => access.Email && access.Email.toLowerCase() === email.toLowerCase()
        );

        return userAccessData || null;
      }
      return null;
    } catch (error) {
      console.error('Error checking user access:', error);
      return null;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;

      // Check if user has access
      const access = await checkUserAccess(email);

      if (!access) {
        await firebaseSignOut(auth);
        throw new Error('You do not have permission to access this dashboard.');
      }

      setUserAccess(access);
      return result.user;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserAccess(null);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return userAccess?.['Access Type']?.toLowerCase() === 'admin';
  };

  // Get user group name
  const getUserGroup = () => {
    return userAccess?.['Group Name'] || '';
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Only show loading on initial load, not on page refreshes for existing users
      if (isInitialLoad) {
        setLoading(true);
      }

      if (currentUser) {
        setUser(currentUser);

        // Check access for existing user
        const access = await checkUserAccess(currentUser.email);

        if (!access) {
          await firebaseSignOut(auth);
          setUser(null);
          setUserAccess(null);
          setError('You do not have permission to access this dashboard.');
        } else {
          setUserAccess(access);
          setError(null);
        }
      } else {
        setUser(null);
        setUserAccess(null);
      }

      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    });

    return unsubscribe;
  }, [isInitialLoad]);

  const value = {
    user,
    userAccess,
    loading,
    error,
    signInWithGoogle,
    signOut,
    isAdmin,
    getUserGroup
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

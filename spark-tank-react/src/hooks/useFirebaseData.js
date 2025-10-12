import { useState, useEffect } from 'react';
import { database } from '../firebase/config';
import { ref, onValue, off } from 'firebase/database';

export function useFirebaseData(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }

    const dataRef = ref(database, path);

    const unsubscribe = onValue(
      dataRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val());
          setError(null);
        } else {
          setData(null);
          setError('No data available');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Firebase read error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => off(dataRef, 'value', unsubscribe);
  }, [path]);

  return { data, loading, error };
}

export function useLeaderboardData() {
  return useFirebaseData('sparkTank/leaderboard');
}

export function useTransactionsData() {
  return useFirebaseData('sparkTank/recentTransactions');
}

export function useMetadata() {
  return useFirebaseData('sparkTank/metadata');
}

export function useLastSync() {
  return useFirebaseData('sparkTank/lastSync');
}

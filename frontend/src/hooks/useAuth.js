import { useState, useEffect } from 'react';
import { getCurrentUser, fetchAuthSession, signOut as amplifySignOut } from 'aws-amplify/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setError(null);
    } catch (err) {
      setUser(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const getToken = async () => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString();
    } catch (err) {
      console.error('Error fetching token:', err);
      return null;
    }
  };

  const refreshToken = async () => {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      return session.tokens?.idToken?.toString();
    } catch (err) {
      console.error('Error refreshing token:', err);
      return null;
    }
  };

  const signOut = async () => {
    try {
      await amplifySignOut();
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    getToken,
    refreshToken,
    signOut,
    checkUser,
  };
};

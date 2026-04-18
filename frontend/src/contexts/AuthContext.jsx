import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, fetchAuthSession, signOut as amplifySignOut } from 'aws-amplify/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userGroups, setUserGroups] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // Fetch user groups from Cognito
      const groups = await getUserGroups();
      setUserGroups(groups);
      setIsAdmin(groups.includes('Admins'));
    } catch (err) {
      setUser(null);
      setUserGroups([]);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const getUserGroups = async () => {
    try {
      const session = await fetchAuthSession();
      const groups = session.tokens?.idToken?.payload['cognito:groups'] || [];
      return groups;
    } catch (err) {
      console.error('Error fetching user groups:', err);
      return [];
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

  const signOut = async () => {
    try {
      await amplifySignOut();
      setUser(null);
      setUserGroups([]);
      setIsAdmin(false);
    } catch (err) {
      console.error('Error signing out:', err);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    userGroups,
    isAdmin,
    getToken,
    signOut,
    checkUser,
    getUserGroups,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 1. Define o hook principal
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 2. Cria um "alias" (apelido) para o nome antigo
// Isto garante que o Admin.jsx continue a funcionar!
export const useAuthContext = useAuth;

export default AuthProvider;
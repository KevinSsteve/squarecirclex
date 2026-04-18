import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * AdminRoute Component
 * 
 * Protects routes that should only be accessible to users in the "Admins" Cognito group.
 * 
 * Usage:
 * <AdminRoute>
 *   <AdminDashboard />
 * </AdminRoute>
 * 
 * Behavior:
 * - Checks if user is in "Admins" Cognito group
 * - If admin: renders children
 * - If not admin: redirects to /dashboard
 * - Shows loading spinner during check
 */
const AdminRoute = ({ children }) => {
  const [authState, setAuthState] = useState({
    isLoading: true,
    isAdmin: false,
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      // Fetch the current auth session
      const session = await fetchAuthSession();
      
      // Extract groups from the ID token
      const groups = session.tokens?.idToken?.payload['cognito:groups'] || [];
      
      // Check if user is in the Admins group
      const isAdmin = groups.includes('Admins');
      
      setAuthState({
        isLoading: false,
        isAdmin,
      });
    } catch (error) {
      console.error('Error checking admin status:', error);
      setAuthState({
        isLoading: false,
        isAdmin: false,
      });
    }
  };

  // Show loading spinner while checking admin status
  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect non-admin users to dashboard
  if (!authState.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render children for admin users
  return children;
};

export default AdminRoute;

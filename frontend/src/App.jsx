import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import amplifyConfig from './config/amplify';
import { AuthProvider } from './contexts/AuthContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { ChatProvider } from './contexts/ChatContext';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import Dashboard from './components/dashboard/Dashboard';
import GameView from './components/game/GameView';
import Onboarding from './components/onboarding/Onboarding';
import Admin from './components/admin/Admin';
import ProfileSettings from './pages/ProfileSettings';
import ConnectAccounts from './pages/ConnectAccounts';
import DeleteAccount from './pages/DeleteAccount';
import ChatPage from './pages/ChatPage';
import LandingPage from './pages/LandingPage';

// Configure Amplify
Amplify.configure(amplifyConfig);

// Wrapper for protected routes with all contexts
const ProtectedWrapper = ({ children }) => (
  <AuthProvider>
    <DashboardProvider>
      <ChatProvider>
        <div className="min-h-screen bg-gray-50 select-none">
          <ProtectedRoute>
            {children}
          </ProtectedRoute>
        </div>
      </ChatProvider>
    </DashboardProvider>
  </AuthProvider>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES - NO AUTH CONTEXT */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* PROTECTED ROUTES - WITH AUTH CONTEXT */}
        {/* Game View Route (Phase 10, Task 64) */}
        <Route
          path="/app"
          element={
            <ProtectedWrapper>
              <GameView />
            </ProtectedWrapper>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedWrapper>
              <ChatPage />
            </ProtectedWrapper>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedWrapper>
              <Onboarding />
            </ProtectedWrapper>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedWrapper>
              <Dashboard />
            </ProtectedWrapper>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedWrapper>
              <AdminRoute>
                <Admin />
              </AdminRoute>
            </ProtectedWrapper>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedWrapper>
              <ProfileSettings />
            </ProtectedWrapper>
          }
        />
        <Route
          path="/connections"
          element={
            <ProtectedWrapper>
              <ConnectAccounts />
            </ProtectedWrapper>
          }
        />
        <Route
          path="/delete-account"
          element={
            <ProtectedWrapper>
              <DeleteAccount />
            </ProtectedWrapper>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
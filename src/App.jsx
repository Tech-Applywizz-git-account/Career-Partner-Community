import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import JobSearch from './pages/JobSearch';
import AuthCallback from './pages/AuthCallback';
import AdminDashboard from './pages/AdminDashboard';
import BlogPage from './pages/BlogPage';
import BlogArticlePage from './pages/BlogArticlePage';
import JobsAllRoles from './pages/JobsAllRoles';
import { AuthProvider } from './hooks/useAuth';
import useDataSync from './hooks/useDataSync';
import DomainSelectionModal from './components/DomainSelectionModal';
import './output.css';


// VisitTracker removed — site_visits table not in current DB
const VisitTracker = () => null;

// Silent background sync component — auto-syncs external DB data daily
const DataSyncWrapper = ({ children }) => {
  const { syncing } = useDataSync();
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <VisitTracker />
        <DomainSelectionModal />
        <DataSyncWrapper>
          <Routes>
            {/* Authentication is now the entry point */}
            <Route path="/" element={<Login />} />

            {/* App pages */}
            <Route path="/app" element={<Homepage />} />
            <Route path="/pricing" element={<Navigate to="/app" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/search" element={<Homepage />} />
            <Route path="/jobs" element={<Homepage />} />
            <Route path="/h1b-finder" element={<Homepage />} />

            {/* OAuth callback */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Admin Dashboard */}
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Blog / Resource Pages */}
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogArticlePage />} />

            {/* Jobs All Roles — fetches from jobs_all_roles table */}
            <Route path="/all-jobs" element={<JobsAllRoles />} />

            {/* Redirect old /dashboard to new /app */}
            <Route path="/dashboard" element={<Navigate to="/app" replace />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DataSyncWrapper>
      </AuthProvider>
    </Router>
  );
}

export default App;

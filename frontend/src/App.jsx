import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { setAuthToken } from './lib/apiClient';
import { useSyncUser } from './hooks/useUser';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { PageLoader } from './components/ui/LoadingStates.jsx';

// Pages
import SignInPage from './pages/SignInPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SongsPage from './pages/SongsPage.jsx';
import PlaylistsPage from './pages/PlaylistsPage.jsx';
import PlaylistDetailPage from './pages/PlaylistDetailPage.jsx';
import RecommendationsPage from './pages/RecommendationsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

/**
 * AuthSync: sets Clerk token on all API clients and syncs user to our backend
 */
function AuthSync({ children }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const syncUser = useSyncUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const setupAuth = async () => {
      const token = await getToken();
      setAuthToken(token);

      // Sync user profile with our backend
      syncUser.mutate({
        clerkUserId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        displayName: user.fullName || user.username,
        avatar: user.imageUrl,
      });
    };

    setupAuth();

    // Refresh token every 55 seconds (Clerk tokens expire in 60s)
    const interval = setInterval(async () => {
      const token = await getToken({ skipCache: true });
      setAuthToken(token);
    }, 55000);

    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn, user?.id]);

  return children;
}

/**
 * ProtectedRoute: redirect unauthenticated users to sign-in
 */
function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <PageLoader />;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  return (
    <AuthSync>
      <AppLayout>{children}</AppLayout>
    </AuthSync>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/songs" element={<ProtectedRoute><SongsPage /></ProtectedRoute>} />
        <Route path="/playlists" element={<ProtectedRoute><PlaylistsPage /></ProtectedRoute>} />
        <Route path="/playlists/:id" element={<ProtectedRoute><PlaylistDetailPage /></ProtectedRoute>} />
        <Route path="/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

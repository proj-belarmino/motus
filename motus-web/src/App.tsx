import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ApiProvider } from "./context/ApiContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

const HomePage = React.lazy(() => import("./pages/HomePage"));
const WatchPage = React.lazy(() => import("./pages/WatchPage"));
const LoginPage = React.lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = React.lazy(() => import("./pages/auth/RegisterPage"));
const SettingsPage = React.lazy(() => import("./pages/SettingsPage"));
const AccountPage = React.lazy(() => import("./pages/settings/AccountPage"));
const PrivacyPage = React.lazy(() => import("./pages/settings/PrivacyPage"));
const NotificationsPage = React.lazy(
  () => import("./pages/settings/NotificationsPage"),
);
const FavoritesPage = React.lazy(() => import("./pages/FavoritesPage"));
const WatchlistPage = React.lazy(() => import("./pages/WatchlistPage"));
const MoviesPage = React.lazy(() => import("./pages/MoviesPage"));
const ShowsPage = React.lazy(() => import("./pages/ShowsPage"));
const ShowDetailPage = React.lazy(() => import("./pages/ShowDetailPage"));

const FullScreenLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-background">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ApiProvider>
            <Suspense fallback={<FullScreenLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/watch/:id" element={<WatchPage />} />
                  <Route path="/watch/episode/:id" element={<WatchPage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/watchlist" element={<WatchlistPage />} />
                  <Route path="/movies" element={<MoviesPage />} />
                  <Route path="/shows" element={<ShowsPage />} />
                  <Route path="/shows/:id" element={<ShowDetailPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/settings/account" element={<AccountPage />} />
                  <Route path="/settings/privacy" element={<PrivacyPage />} />
                  <Route
                    path="/settings/notifications"
                    element={<NotificationsPage />}
                  />
                </Route>
              </Routes>
            </Suspense>
          </ApiProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

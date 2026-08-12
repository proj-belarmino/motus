import { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../context/ApiContext";
import { Sidebar } from "./Sidebar";
import { warmCollection } from "../hooks/usePersonalCollection";
import { warmMovies } from "../hooks/useMovies";

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const location = useLocation();

  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebar-expanded");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    // Preload personal collections and the home library so switching tabs
    // renders instantly instead of flashing loading skeletons.
    void warmCollection("favorites", api);
    void warmCollection("watchlist", api);
    void warmMovies(api);
  }, [isAuthenticated, api]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Hide sidebar on the watch/player page
  const isWatchPage = location.pathname.startsWith("/watch/");

  if (isWatchPage) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      <div
        className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
          isExpanded ? "sm:pl-64 pl-0" : "sm:pl-20 pl-0"
        }`}
      >
        <Outlet />
      </div>
    </div>
  );
}

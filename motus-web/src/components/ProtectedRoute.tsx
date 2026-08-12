import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sidebar } from "./Sidebar";

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebar-expanded");
    return saved !== null ? JSON.parse(saved) : true;
  });

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

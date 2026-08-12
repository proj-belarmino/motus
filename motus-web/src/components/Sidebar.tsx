import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Film,
  Tv,
  Heart,
  Bookmark,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isExpanded,
  setIsExpanded,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      path: "/",
      active: location.pathname === "/",
      disabled: false,
    },
    {
      id: "movies",
      label: "Movies",
      icon: Film,
      path: "/movies",
      active: location.pathname === "/movies",
      disabled: true,
      badge: "Soon",
    },
    {
      id: "tv",
      label: "TV Shows",
      icon: Tv,
      path: "/shows",
      active: location.pathname.startsWith("/shows"),
      disabled: false,
    },
    {
      id: "favorites",
      label: "Favourites",
      icon: Heart,
      path: "/favorites",
      active: location.pathname.startsWith("/favorites"),
      disabled: false,
    },
    {
      id: "watchlist",
      label: "Watchlist",
      icon: Bookmark,
      path: "/watchlist",
      active: location.pathname.startsWith("/watchlist"),
      disabled: false,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/settings",
      active: location.pathname.startsWith("/settings"),
      disabled: false,
    },
  ];

  const handleItemClick = (path: string, disabled: boolean) => {
    if (disabled) return;
    navigate(path);
  };

  return (
    <aside
      className={`fixed bottom-0 top-0 left-0 z-40 hidden flex-col border-r border-border bg-surface/90 pt-20 backdrop-blur-xl transition-all duration-300 ease-in-out sm:flex ${
        isExpanded ? "w-64" : "w-20"
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => {
          const nextExpanded = !isExpanded;
          setIsExpanded(nextExpanded);
          localStorage.setItem(
            "sidebar-expanded",
            JSON.stringify(nextExpanded),
          );
        }}
        className="absolute -right-3 top-24 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-md transition-transform hover:scale-105 hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isExpanded ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Navigation Tabs */}
      <nav className="flex-1 space-y-1.5 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.path, item.disabled)}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                item.active
                  ? "bg-primary text-white shadow-lg shadow-primary/10"
                  : item.disabled
                    ? "text-muted/40 cursor-not-allowed"
                    : "text-foreground hover:bg-surface-hover hover:text-foreground cursor-pointer"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 transition-colors ${
                  item.active
                    ? "text-white"
                    : item.disabled
                      ? "text-muted/30"
                      : "text-primary group-hover:text-primary-hover"
                }`}
              />

              <span
                className={`truncate transition-all duration-300 ${
                  isExpanded
                    ? "opacity-100 w-auto"
                    : "opacity-0 w-0 pointer-events-none"
                }`}
              >
                {item.label}
              </span>

              {item.badge && isExpanded && (
                <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {item.badge}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {!isExpanded && (
                <div className="pointer-events-none absolute left-16 z-50 ml-2 hidden rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-xl group-hover:block whitespace-nowrap">
                  {item.label} {item.disabled && "(Coming Soon)"}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

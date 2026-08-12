import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  Upload,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { useAuth } from "../context/AuthContext";
import UploadModal from "./UploadModal";
import SearchOverlay from "./SearchOverlay";
import SyncModal from "./SyncModal";

interface NavbarProps {
  onSearch: (term: string) => void;
  onScan: () => void | Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch, onScan }) => {
  const { logout, user } = useAuth();
  const api = useApi();
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [scanState, setScanState] = useState<
    "idle" | "syncing" | "done" | "error"
  >("idle");
  const scanTimeout = useRef<number | null>(null);
  const avatarUrl = user?.avatarPath ? api.getAvatarUrl(user.avatarPath) : null;
  const avatar = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-bold text-white shadow-sm">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        user?.name?.charAt(0).toUpperCase() || "U"
      )}
    </span>
  );

  useEffect(
    () => () => {
      if (scanTimeout.current) window.clearTimeout(scanTimeout.current);
    },
    [],
  );
  const handleScan = async () => {
    try {
      setScanState("syncing");
      await onScan();
      setScanState("done");
      scanTimeout.current = window.setTimeout(() => setScanState("idle"), 5000);
    } catch {
      setScanState("error");
    }
  };
  const openUpload = () => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    setShowUploadModal(true);
  };
  const openSync = () => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    setShowSyncModal(true);
  };
  const openSearch = () => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    setSearchOpen(true);
  };
  const commitSearch = (term: string) => {
    setSearchOpen(false);
    onSearch(term);
  };
  const menuItemClass =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-surface/90 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="shrink-0 text-xl font-extrabold tracking-[-0.07em] text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 sm:text-2xl"
          >
            NycoFlix
          </button>
          <div className="relative hidden min-w-0 flex-1 justify-center sm:flex">
              <div className="relative w-full max-w-xs lg:max-w-sm xl:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  placeholder="Search your library"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onFocus={openSearch}
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          <div className="relative hidden md:block">
            <button
              onClick={() => setProfileMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-xl border border-transparent py-1 pl-1 pr-2 text-left transition hover:border-border hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Open profile menu"
              aria-expanded={profileMenuOpen}
            >
              {avatar}
              <ChevronDown
                className={`h-4 w-4 text-muted transition ${profileMenuOpen ? "rotate-180" : ""}`}
              />
            </button>
            {profileMenuOpen && (
              <div className="animate-rise-in absolute right-0 top-[calc(100%+10px)] w-60 rounded-2xl border border-border bg-surface p-2 shadow-2xl">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <span>{avatar}</span>
                  <span className="min-w-0">
                    <b className="block truncate text-sm">
                      {user?.name || "NycoFlix User"}
                    </b>
                    <small className="block truncate text-xs text-muted">
                      {user?.email}
                    </small>
                  </span>
                </div>
                <div className="my-1 border-t border-border" />
                <button onClick={openUpload} className={menuItemClass}>
                  <Upload className="h-4 w-4 text-primary" /> Upload media
                </button>
                <button
                  onClick={openSync}
                  disabled={scanState === "syncing"}
                  className={menuItemClass}
                >
                  <RefreshCw
                    className={`h-4 w-4 text-primary ${scanState === "syncing" ? "animate-spin" : ""}`}
                  />{" "}
                  {scanState === "syncing" ? "Syncing library" : "Sync library"}
                </button>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/settings");
                  }}
                  className={menuItemClass}
                >
                  <SettingsIcon className="h-4 w-4 text-muted" /> Settings
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={logout}
                  className={`${menuItemClass} text-red-500`}
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="relative mt-3 sm:hidden">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Search your library"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onFocus={openSearch}
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {mobileMenuOpen && (
          <div className="animate-rise-in mx-auto mt-3 max-w-7xl border-t border-border pt-3 md:hidden">
            <div className="mb-2 flex items-center gap-3 rounded-xl bg-background p-3">
              {avatar}
              <span className="min-w-0">
                <b className="block truncate text-sm">
                  {user?.name || "NycoFlix User"}
                </b>
                <small className="block truncate text-xs text-muted">
                  {user?.email}
                </small>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={openUpload} className={menuItemClass}>
                <Upload className="h-4 w-4 text-primary" /> Upload
              </button>
              <button onClick={openSync} className={menuItemClass}>
                <RefreshCw
                  className={`h-4 w-4 text-primary ${scanState === "syncing" ? "animate-spin" : ""}`}
                />{" "}
                Sync
              </button>
              <button
                onClick={() => navigate("/settings")}
                className={menuItemClass}
              >
                <SettingsIcon className="h-4 w-4 text-muted" /> Settings
              </button>
              <button
                onClick={logout}
                className={`${menuItemClass} text-red-500`}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        )}
      </nav>
      {scanState !== "idle" && (
        <div className="animate-rise-in fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-3 rounded-2xl border border-border bg-surface/95 p-4 shadow-2xl backdrop-blur-xl">
          <span
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${scanState === "error" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"}`}
          >
            {scanState === "syncing" ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : scanState === "done" ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </span>
          <div>
            <p className="text-sm font-bold">
              {scanState === "syncing"
                ? "Syncing your library"
                : scanState === "done"
                  ? "Library sync started"
                  : "Could not start sync"}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-muted">
              {scanState === "syncing"
                ? "Looking for new and updated media."
                : scanState === "done"
                  ? "Your collection will update in the background."
                  : "Please try again in a moment."}
            </p>
          </div>
          {scanState !== "syncing" && (
            <button
              onClick={() => setScanState("idle")}
              className="rounded-lg p-1 text-muted hover:bg-surface-hover"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            void handleScan();
          }}
        />
      )}
      {showSyncModal && (
        <SyncModal
          onClose={() => setShowSyncModal(false)}
          onConfirm={() => {
            setShowSyncModal(false);
            void handleScan();
          }}
        />
      )}
      {searchOpen && (
        <SearchOverlay
          term={searchTerm}
          onTermChange={setSearchTerm}
          onClose={() => setSearchOpen(false)}
          onCommit={commitSearch}
        />
      )}
    </>
  );
};

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Camera,
  Check,
  ChevronRight,
  Moon,
  Palette,
  Shield,
  Sun,
  Upload,
  User,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../context/ApiContext";
import { TokenService } from "../services/TokenService";

type ActivityDay = { date: string; count: number };
type HeatmapDay = { key: string; count: number };
const activityLevels = [
  "bg-emerald-500/10",
  "bg-emerald-500/35",
  "bg-emerald-500/60",
  "bg-emerald-400",
];

function ActivityHeatmap({ activity }: { activity: ActivityDay[] }) {
  const { weeks, total } = useMemo(() => {
    const counts = new Map(activity.map((entry) => [entry.date, entry.count]));
    const days: HeatmapDay[] = Array.from({ length: 364 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (363 - index));
      const key = date.toISOString().slice(0, 10);
      return { key, count: counts.get(key) || 0 };
    });
    const buckets: HeatmapDay[][] = [];
    for (let index = 0; index < days.length; index += 7) {
      buckets.push(days.slice(index, index + 7));
    }
    return {
      weeks: buckets,
      total: activity.reduce((sum, entry) => sum + entry.count, 0),
    };
  }, [activity]);
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold">Watching activity</p>
          <p className="mt-1 text-sm text-muted">
            {total
              ? `${total} play ${total === 1 ? "session" : "sessions"} in the past year`
              : "Your viewing moments will appear here."}
          </p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          Last 12 months
        </span>
      </div>
      <div className="flex gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-1 flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.key}
                title={`${day.key}: ${day.count} play ${day.count === 1 ? "session" : "sessions"}`}
                className={`aspect-square w-full rounded-sm ${day.count === 0 ? "bg-surface-hover" : activityLevels[Math.min(day.count, 4) - 1]}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-xs text-muted">
        <span>Less</span>
        {activityLevels.map((level) => (
          <i key={level} className={`h-3 w-3 rounded-sm ${level}`} />
        ))}
        <span>More</span>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, setAuthSession } = useAuth();
  const api = useApi();
  const fileInput = useRef<HTMLInputElement>(null);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    void api
      .getActivity()
      .then(setActivity)
      .catch(() => setActivity([]));
  }, [api]);
  const avatarUrl = user?.avatarPath ? api.getAvatarUrl(user.avatarPath) : null;
  const uploadAvatar = async (file?: File) => {
    if (!file) return;
    if (
      !file.type.match(/^image\/(jpeg|png|webp)$/) ||
      file.size > 5 * 1024 * 1024
    ) {
      setMessage("Use a JPEG, PNG, or WebP image smaller than 5 MB.");
      return;
    }
    try {
      setUploading(true);
      setMessage("");
      const response = await api.uploadAvatar(file);
      const token = response.token || TokenService.getToken();
      if (token && response.user) setAuthSession(token, response.user);
      setMessage("Profile picture updated.");
    } catch {
      setMessage("Could not update your profile picture.");
    } finally {
      setUploading(false);
    }
  };
  const itemClass =
    "flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-surface-hover sm:px-6";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-surface-hover"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Your space
            </p>
            <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-7 sm:px-6 sm:py-10">
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="bg-[linear-gradient(120deg,var(--color-surface-hover),var(--color-border))] px-5 pb-12 pt-6 sm:px-7 dark:bg-[radial-gradient(circle_at_80%_0%,rgba(229,9,20,.26),transparent_46%),linear-gradient(120deg,#171717,#232323)]">
            <p className="text-sm font-medium text-muted dark:text-white/65">
              Profile
            </p>
            <h2 className="mt-1 text-2xl font-bold text-foreground dark:text-white">
              Make NycoFlix yours
            </h2>
          </div>
          <div className="relative px-5 pb-6 sm:px-7">
            <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <button
                  onClick={() => fileInput.current?.click()}
                  className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-surface bg-primary text-2xl font-bold text-white shadow-lg"
                  aria-label="Change profile picture"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || "U"
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition group-hover:opacity-100">
                    <Camera className="h-5 w-5" />
                  </span>
                </button>
                <div>
                  <h3 className="text-xl font-bold">
                    {user?.name || "NycoFlix User"}
                  </h3>
                  <p className="text-sm text-muted">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-hover disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />{" "}
                {uploading ? "Uploading…" : "Change photo"}
              </button>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                void uploadAvatar(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            {message && (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                <Check className="h-4 w-4 text-emerald-500" /> {message}
              </p>
            )}
          </div>
        </section>
        <ActivityHeatmap activity={activity} />
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
              <div>
                <p className="font-semibold">Appearance</p>
                <p className="text-sm text-muted">
                  Currently using {theme} mode
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="relative h-7 w-12 rounded-full bg-border transition focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Toggle colour theme"
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${theme === "dark" ? "left-6" : "left-1"}`}
              />
            </button>
          </div>
        </section>
        <section>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">
            <Palette className="h-4 w-4" /> Account & preferences
          </p>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <button
              onClick={() => navigate("/settings/account")}
              className={itemClass}
            >
              <span className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted" />
                <span>
                  <b className="block font-semibold">Account details</b>
                  <small className="text-muted">
                    Name, email, and password
                  </small>
                </span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted" />
            </button>
            <button
              onClick={() => navigate("/settings/privacy")}
              className={`${itemClass} border-t border-border`}
            >
              <span className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted" />
                <span>
                  <b className="block font-semibold">Privacy & data</b>
                  <small className="text-muted">
                    Control your library data
                  </small>
                </span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted" />
            </button>
            <button
              onClick={() => navigate("/settings/notifications")}
              className={`${itemClass} border-t border-border`}
            >
              <span className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted" />
                <span>
                  <b className="block font-semibold">Notifications</b>
                  <small className="text-muted">
                    Choose what you hear about
                  </small>
                </span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

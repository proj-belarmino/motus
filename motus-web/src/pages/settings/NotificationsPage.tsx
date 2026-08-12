import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [newReleases, setNewReleases] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <header className="sticky top-0 z-50 flex items-center border-b border-border bg-surface/90 px-6 py-4 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 rounded-full p-2 hover:bg-surface-hover"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold">Notifications</h1>
      </header>
      <main className="mx-auto max-w-3xl p-6 md:p-10">
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-6">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted">
                Receive account updates and security alerts
              </p>
            </div>
            <button
              onClick={() => setEmailNotifs(!emailNotifs)}
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none"
              style={{
                backgroundColor: emailNotifs
                  ? "var(--color-primary)"
                  : "var(--border-color)",
              }}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${emailNotifs ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="font-medium">New Releases</p>
              <p className="text-sm text-muted">
                Get notified when new content is added to NycoFlix
              </p>
            </div>
            <button
              onClick={() => setNewReleases(!newReleases)}
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none"
              style={{
                backgroundColor: newReleases
                  ? "var(--color-primary)"
                  : "var(--border-color)",
              }}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${newReleases ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

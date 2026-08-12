import { RefreshCw, X } from "lucide-react";

interface SyncModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

export default function SyncModal({ onConfirm, onClose }: SyncModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Sync library confirmation"
    >
      <div className="animate-rise-in w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-bold text-foreground">
            Sync your library?
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted transition hover:bg-surface-hover hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4 rounded-xl border border-border bg-background p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <RefreshCw className="h-5 w-5" />
            </span>
            <div className="text-sm leading-6 text-muted">
              <p className="font-semibold text-foreground">
                Scan your media folder
              </p>
              <p className="mt-1">
                NycoFlix will look for new titles and refresh metadata for
                existing ones. This runs in the background, so you can keep
                browsing while it works.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              autoFocus
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover"
            >
              <RefreshCw className="h-4 w-4" /> Sync now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

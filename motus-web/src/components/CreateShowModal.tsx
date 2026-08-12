import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  Star,
  Tv,
  X,
} from "lucide-react";
import { useApi } from "../context/ApiContext";
import { Show, ShowSearchResult } from "../types";

interface CreateShowModalProps {
  onClose: () => void;
  onCreated: (show: Show) => void;
}

export default function CreateShowModal({
  onClose,
  onCreated,
}: CreateShowModalProps) {
  const api = useApi();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [results, setResults] = useState<ShowSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const trimmed = name.trim();
    const timeoutId = window.setTimeout(async () => {
      if (trimmed.length < 2) {
        if (!cancelled) {
          setResults([]);
          setLoading(false);
        }
        return;
      }
      if (!cancelled) setLoading(true);
      try {
        const found = await api.searchShows(trimmed);
        if (!cancelled) setResults(found);
      } catch {
        if (!cancelled) {
          setResults([]);
          setError("Could not reach the metadata service.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [name, api]);

  const handleCreate = useCallback(
    async (title: string, tmdbId?: number) => {
      setCreating(true);
      setError("");
      try {
        const show = await api.createShow(title, tmdbId);
        onCreated(show);
      } catch {
        setError("Could not create this show. Please try again.");
      } finally {
        setCreating(false);
      }
    },
    [api, onCreated],
  );

  const trimmedName = name.trim();
  const showEmpty = trimmedName.length >= 2 && !loading && results.length === 0;

  return (
    <div
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-label="Create a show"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative mx-auto mt-16 w-full max-w-2xl px-4 sm:mt-24">
        <div className="animate-rise-in overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border px-4 py-4 sm:px-5">
            <Tv className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <input
                ref={inputRef}
                type="search"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    const first = results[0];
                    if (first) void handleCreate(name.trim(), first.tmdbId);
                    else void handleCreate(name.trim());
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    onClose();
                  }
                }}
                placeholder="Search for a show, e.g. Breaking Bad"
                aria-label="Search for a show"
                className="min-w-0 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted"
              />
            </div>
            {loading ? (
              <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-muted" />
            ) : (
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted transition hover:bg-surface-hover"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="max-h-[min(60vh,480px)] overflow-y-auto p-2">
            {showEmpty ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <Tv className="h-8 w-8 text-muted/60" />
                <div>
                  <p className="font-semibold text-foreground">
                    No matches for “{trimmedName}”
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    You can still create the show manually below.
                  </p>
                </div>
              </div>
            ) : loading ? (
              <div className="space-y-1">
                {Array.from({ length: 6 }, (_, index) => (
                  <div
                    key={index}
                    className="animate-soft-pulse flex items-center gap-3 rounded-xl p-2"
                  >
                    <div className="h-14 w-10 shrink-0 rounded-md bg-surface-hover" />
                    <div className="h-4 flex-1 rounded bg-surface-hover" />
                  </div>
                ))}
              </div>
            ) : (
              results.map((result) => {
                const coverUrl = result.posterUrl || "";
                return (
                  <button
                    key={result.tmdbId}
                    onClick={() =>
                      void handleCreate(trimmedName, result.tmdbId)
                    }
                    disabled={creating}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-surface-hover disabled:cursor-wait disabled:opacity-60"
                  >
                    <span className="flex h-16 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt=""
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-muted/50" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {result.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {result.year ? `${result.year} · ` : ""}
                        {result.genres.slice(0, 2).join(", ") || "TV"}
                      </span>
                      {result.overview ? (
                        <span className="mt-1 line-clamp-1 block text-xs text-muted/80">
                          {result.overview}
                        </span>
                      ) : null}
                    </span>
                    {result.rating ? (
                      <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-amber-300">
                        <Star className="h-3.5 w-3.5 fill-current" />{" "}
                        {result.rating.toFixed(1)}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {error && (
            <p className="border-t border-border px-5 py-3 text-sm font-medium text-red-500">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
            <span className="text-xs text-muted">
              Pick a match or create it manually with any name.
            </span>
            <button
              onClick={() => void handleCreate(trimmedName)}
              disabled={!trimmedName || creating}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creating ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create show
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

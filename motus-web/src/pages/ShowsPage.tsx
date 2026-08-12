import { useCallback, useEffect, useState } from "react";
import { Film, Plus, RefreshCw, Star, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import CreateShowModal from "../components/CreateShowModal";
import { useApi } from "../context/ApiContext";
import { Show } from "../types";

const cache: { shows: Show[] | null } = { shows: null };

export default function ShowsPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [shows, setShows] = useState<Show[]>(cache.shows ?? []);
  const [loading, setLoading] = useState(cache.shows === null);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const loadShows = useCallback(async () => {
    try {
      const result = await api.getShows();
      cache.shows = result;
      setShows(result);
      setError("");
    } catch {
      setError("Your shows could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    // This page owns the shows request for the library.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadShows();
  }, [loadShows]);

  const totalEpisodes = shows.reduce(
    (sum, show) => sum + show.episodes.length,
    0,
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground transition-colors duration-300">
      <Navbar onSearch={() => undefined} onScan={() => undefined} />

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-9 sm:px-8 sm:pt-12 lg:px-12">
        <div className="mb-8 flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <Tv className="h-4 w-4" /> Episode collections
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              TV Shows
            </h2>
            <p className="mt-1 text-sm text-muted">
              {shows.length
                ? `${shows.length} shows · ${totalEpisodes} episodes`
                : "Stack episodes around a single title"}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => void loadShows()}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold transition hover:bg-surface-hover"
            >
              <RefreshCw className="h-4 w-4 text-primary" /> Refresh
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4" /> Add show
            </button>
          </div>
        </div>

        {error ? (
          <div className="animate-rise-in flex h-56 flex-col items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/5 px-5 text-center">
            <p className="font-semibold text-foreground">
              Your shows could not be loaded
            </p>
            <p className="mt-1 text-sm text-muted">{error}</p>
            <button
              onClick={() => void loadShows()}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }, (_, index) => (
              <div
                key={index}
                className="animate-soft-pulse aspect-[2/3] rounded-xl bg-surface-hover"
              />
            ))}
          </div>
        ) : shows.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {shows.map((show, index) => (
              <div
                key={show.id}
                className="animate-rise-in"
                style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
              >
                <ShowCard
                  show={show}
                  onClick={() => navigate(`/shows/${show.id}`)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 text-center text-muted">
            <Tv className="mb-3 h-8 w-8 opacity-50" />
            <p className="font-medium text-foreground">No shows yet</p>
            <p className="mt-1 text-sm">
              Create a show, then upload its episodes.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4" /> Add your first show
            </button>
          </div>
        )}
      </main>

      {createOpen && (
        <CreateShowModal
          onClose={() => setCreateOpen(false)}
          onCreated={(show) => {
            setCreateOpen(false);
            void navigate(`/shows/${show.id}`);
          }}
        />
      )}
    </div>
  );
}

function ShowCard({ show, onClick }: { show: Show; onClick: () => void }) {
  const api = useApi();
  const [imgError, setImgError] = useState(false);
  const coverUrl =
    show.cover_path && !imgError ? api.getThumbnailUrl(show.cover_path) : null;
  const year = show.release_date ? show.release_date.split("-")[0] : "New";
  const episodes = show.episodes.length;

  return (
    <button
      onClick={onClick}
      className="group relative aspect-[2/3] overflow-hidden rounded-xl border border-border bg-surface text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={show.title}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center bg-surface-hover text-muted">
          <Film className="h-9 w-9 opacity-40" />
          <span className="mt-2 text-xs">No artwork</span>
        </div>
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-90" />
      <span className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <span className="block truncate text-sm font-bold text-white sm:text-base">
          {show.title}
        </span>
        <span className="mt-1.5 flex items-center justify-between text-xs text-white/70">
          <span>
            {year} ·{" "}
            {episodes
              ? `${episodes} ${episodes === 1 ? "episode" : "episodes"}`
              : "No episodes"}
          </span>
          {show.rating ? (
            <span className="flex items-center gap-1 font-medium text-amber-300">
              <Star className="h-3 w-3 fill-current" /> {show.rating}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

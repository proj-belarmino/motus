import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, RefreshCw } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { MovieCard } from "../components/MovieCard";
import MovieModal from "../components/MovieModal";
import { usePersonalCollection } from "../hooks/usePersonalCollection";
import { Movie } from "../types";

export default function WatchlistPage() {
  const {
    items: movies,
    loading,
    error,
    load: loadWatchlist,
    remove,
  } = usePersonalCollection("watchlist");
  const navigate = useNavigate();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground transition-colors duration-300">
      <Navbar onSearch={() => undefined} onScan={() => undefined} />

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-9 sm:px-8 sm:pt-12 lg:px-12">
        <div className="mb-8 flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <Bookmark className="h-4 w-4" /> Saved for later
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Watchlist
            </h2>
            <p className="mt-1 text-sm text-muted">
              {movies.length
                ? `${movies.length} ${movies.length === 1 ? "title" : "titles"} to watch`
                : "Keep track of what you want to watch"}
            </p>
          </div>
          <button
            onClick={() => void loadWatchlist()}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold transition hover:bg-surface-hover sm:self-auto"
          >
            <RefreshCw className="h-4 w-4 text-primary" /> Refresh
          </button>
        </div>

        {error ? (
          <div className="animate-rise-in flex h-56 flex-col items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/5 px-5 text-center">
            <p className="font-semibold text-foreground">
              Your watchlist could not be loaded
            </p>
            <p className="mt-1 text-sm text-muted">{error}</p>
            <button
              onClick={() => void loadWatchlist()}
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
        ) : movies.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {movies.map((movie, index) => (
              <div
                key={movie.id}
                className="animate-rise-in"
                style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
              >
                <MovieCard
                  movie={movie}
                  inWatchlist
                  onClick={() => setSelectedMovie(movie)}
                  onPlay={() => navigate(`/watch/${movie.id}`)}
                  onChanged={(kind, value) => {
                    if (kind === "watchlist" && !value) remove(movie.id);
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 text-center text-muted">
            <Bookmark className="mb-3 h-8 w-8 opacity-50" />
            <p className="font-medium text-foreground">
              Your watchlist is empty
            </p>
            <p className="mt-1 text-sm">
              Save titles to watch later and they will appear here.
            </p>
          </div>
        )}
      </main>

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onUpdate={loadWatchlist}
        />
      )}
    </div>
  );
}

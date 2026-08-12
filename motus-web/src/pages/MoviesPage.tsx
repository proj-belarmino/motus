import { useCallback, useState } from "react";
import { Clapperboard, Film, Filter, SlidersHorizontal } from "lucide-react";
import { useMovies } from "../hooks/useMovies";
import { Navbar } from "../components/Navbar";
import { MovieCard } from "../components/MovieCard";
import MovieModal from "../components/MovieModal";
import { Movie } from "../types";

export default function MoviesPage() {
  const { data, error, query, updateSearch, triggerScan, refresh } =
    useMovies();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const handleSearch = useCallback(
    (term: string) => updateSearch({ title: term || undefined }),
    [updateSearch],
  );
  const handleNextPage = () =>
    data &&
    data.number < data.totalPages - 1 &&
    updateSearch({ page: (query.page || 0) + 1 });
  const handlePrevPage = () =>
    query.page && query.page > 0 && updateSearch({ page: query.page - 1 });

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground transition-colors duration-300">
      <Navbar onSearch={handleSearch} onScan={triggerScan} />

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-9 sm:px-8 sm:pt-12 lg:px-12">
        <div className="mb-7 flex flex-col gap-5 border-b border-border pb-7 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <Film className="h-4 w-4" /> Everything that isn’t a show
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Movies
            </h2>
            <p className="mt-1 text-sm text-muted">
              {data
                ? `${data.totalElements} ${data.totalElements === 1 ? "movie" : "movies"} ready to watch`
                : "Browse your movie collection"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <SlidersHorizontal className="h-4 w-4" /> Refine your selection
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-border bg-surface/80 p-3 shadow-sm backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:p-4">
          <div className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-muted">
            <Filter className="h-4 w-4" /> Filters
          </div>
          <select
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:min-w-38 sm:flex-none"
            value={query.genre || ""}
            onChange={(event) =>
              updateSearch({ genre: event.target.value || undefined })
            }
          >
            <option value="">All genres</option>
            {[
              "Action",
              "Comedy",
              "Drama",
              "Sci-Fi",
              "Horror",
              "Thriller",
              "Romance",
              "Documentary",
              "Animation",
              "Adventure",
              "Fantasy",
              "Family",
            ].map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          <select
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:min-w-40 sm:flex-none"
            value={query.sortBy || "title"}
            onChange={(event) => updateSearch({ sortBy: event.target.value })}
          >
            <option value="title">Title</option>
            <option value="releaseDate">Release date</option>
            <option value="rating">Rating</option>
          </select>
          <select
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:min-w-35 sm:flex-none"
            value={query.sortOrder || "ASC"}
            onChange={(event) =>
              updateSearch({ sortOrder: event.target.value as "ASC" | "DESC" })
            }
          >
            <option value="ASC">Ascending</option>
            <option value="DESC">Descending</option>
          </select>
        </div>

        {error ? (
          <div className="animate-rise-in flex h-56 flex-col items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/5 px-5 text-center">
            <p className="font-semibold text-foreground">
              Your movies could not be loaded
            </p>
            <p className="mt-1 text-sm text-muted">{error}</p>
            <button
              onClick={refresh}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Try again
            </button>
          </div>
        ) : data ? (
          <>
            {data.content.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {data.content.map((movie, index) => (
                  <div
                    key={movie.id}
                    className="animate-rise-in"
                    style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
                  >
                    <MovieCard
                      movie={movie}
                      onClick={() => setSelectedMovie(movie)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 text-center text-muted">
                <Clapperboard className="mb-3 h-8 w-8 opacity-50" />
                <p className="font-medium text-foreground">No movies found</p>
                <p className="mt-1 text-sm">
                  Try changing your filters or search.
                </p>
              </div>
            )}
            {data.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3 sm:gap-6">
                <button
                  onClick={handlePrevPage}
                  disabled={data.number === 0}
                  className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-muted">
                  Page {data.number + 1} of {data.totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={data.number >= data.totalPages - 1}
                  className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }, (_, index) => (
              <div
                key={index}
                className="animate-soft-pulse aspect-[2/3] rounded-xl bg-surface-hover"
              />
            ))}
          </div>
        )}
      </main>

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onUpdate={refresh}
        />
      )}
    </div>
  );
}
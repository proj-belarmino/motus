import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clapperboard,
  Filter,
  Info,
  Play,
  SlidersHorizontal,
  Sparkles,
  Star,
} from "lucide-react";
import { useMovies } from "../hooks/useMovies";
import { Navbar } from "../components/Navbar";
import { MovieCard } from "../components/MovieCard";
import MovieModal from "../components/MovieModal";
import { useApi } from "../context/ApiContext";
import { Movie } from "../types";

export default function HomePage() {
  const { data, error, query, updateSearch, triggerScan, refresh } =
    useMovies();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [heroImgError, setHeroImgError] = useState(false);
  const [lastWatched, setLastWatched] = useState<Movie[]>([]);
  const api = useApi();
  const navigate = useNavigate();
  const heroMovie = data?.content[0];

  useEffect(() => {
    void api
      .getRecentMovies()
      .then(setLastWatched)
      .catch(() => setLastWatched([]));
  }, [api]);

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

      {heroMovie && query.page === 0 && !query.title && (
        <section className="relative isolate min-h-[540px] overflow-hidden border-b border-border bg-[#101010] sm:min-h-[620px] lg:min-h-[680px]">
          {!heroImgError && heroMovie.cover_path ? (
            <img
              src={api.getThumbnailUrl(heroMovie.cover_path)}
              alt=""
              onError={() => setHeroImgError(true)}
              className="absolute inset-0 h-full w-full object-cover object-center opacity-55"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_40%,#5f1318_0%,#171717_42%,#090909_85%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/35" />
          <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative mx-auto flex min-h-[540px] max-w-7xl items-end px-5 pb-14 pt-28 sm:min-h-[620px] sm:px-8 sm:pb-20 lg:min-h-[680px] lg:px-12">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Featured
                tonight
              </div>
              <h1 className="max-w-xl text-4xl font-bold tracking-[-0.035em] text-white drop-shadow-lg sm:text-5xl lg:text-7xl">
                {heroMovie.title}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-white/75 sm:text-base">
                <span className="inline-flex items-center gap-1 text-amber-300">
                  <Star className="h-4 w-4 fill-current" />{" "}
                  {heroMovie.rating || "—"}
                </span>
                <span className="h-1 w-1 rounded-full bg-white/50" />
                <span>
                  {heroMovie.release_date?.split("-")[0] || "New release"}
                </span>
                <span className="h-1 w-1 rounded-full bg-white/50" />
                <span>{heroMovie.metadata?.resolution || "HD"}</span>
                {heroMovie.genres?.[0] && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/50" />
                    <span>{heroMovie.genres[0]}</span>
                  </>
                )}
              </div>
              <p className="mt-5 max-w-lg text-sm leading-6 text-white/75 sm:text-base sm:leading-7">
                Settle in for a great watch, streamed from your personal library
                in {heroMovie.metadata?.resolution || "high definition"}.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/watch/${heroMovie.id}`)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black shadow-xl transition hover:scale-[1.02] hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black sm:px-6 sm:text-base"
                >
                  <Play className="h-5 w-5 fill-current" /> Play now
                </button>
                <button
                  onClick={() => setSelectedMovie(heroMovie)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white shadow-lg backdrop-blur-md transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white sm:px-6 sm:text-base"
                >
                  <Info className="h-5 w-5" /> Details
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="relative mx-auto max-w-7xl px-4 pb-14 pt-9 sm:px-8 sm:pt-12 lg:px-12">
        <div className="mb-7 flex flex-col gap-5 border-b border-border pb-7 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <Clapperboard className="h-4 w-4" /> Your library
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Find your next favorite
            </h2>
            <p className="mt-1 text-sm text-muted">
              {data
                ? `${data.totalElements} titles ready to watch`
                : "Browse your collection"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <SlidersHorizontal className="h-4 w-4" /> Refine your selection
          </div>
        </div>

        {lastWatched.length > 0 && (
          <section className="animate-rise-in mb-10">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Continue watching
                </p>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Last watched
                </h2>
              </div>
              <span className="hidden text-sm text-muted sm:block">
                Your recently played titles
              </span>
            </div>
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:-mx-8 sm:gap-4 sm:px-8 lg:-mx-12 lg:px-12">
              {lastWatched.map((movie) => (
                <div
                  key={movie.id}
                  className="w-36 shrink-0 snap-start sm:w-44 lg:w-48"
                >
                  <MovieCard
                    movie={movie}
                    onClick={() => setSelectedMovie(movie)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

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
              Your library could not be loaded
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
                <p className="font-medium text-foreground">No titles found</p>
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

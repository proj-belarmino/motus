import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Play, Sparkles, Star } from "lucide-react";
import { useMovies } from "../hooks/useMovies";
import { Navbar } from "../components/Navbar";
import { MovieCard } from "../components/MovieCard";
import MovieModal from "../components/MovieModal";
import { useApi } from "../context/ApiContext";
import { Movie } from "../types";

const MIN_ROW_ITEMS = 6;

export default function HomePage() {
  const { data, refresh, triggerScan } = useMovies();
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

  const loopEnabled = lastWatched.length >= MIN_ROW_ITEMS;
  const displayItems = loopEnabled
    ? [...lastWatched, ...lastWatched]
    : lastWatched;
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rowRef.current;
    if (!el || !loopEnabled) return;
    let setWidth = 0;
    const measure = () => {
      setWidth = el.scrollWidth / 2;
    };
    measure();
    const onScroll = () => {
      if (setWidth && el.scrollLeft >= setWidth) {
        el.scrollLeft -= setWidth;
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [loopEnabled, lastWatched]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground transition-colors duration-300">
      <Navbar onSearch={() => undefined} onScan={triggerScan} />

      {heroMovie && (
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
            <div
              ref={rowRef}
              className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:-mx-8 sm:gap-4 sm:px-8 lg:-mx-12 lg:px-12"
            >
              {displayItems.map((movie, index) => (
                <div
                  key={`${movie.id}-${index}`}
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
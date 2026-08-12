import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Film,
  Info,
  Play,
  Sparkles,
  Star,
  Tv,
} from "lucide-react";
import { useMovies } from "../hooks/useMovies";
import { Navbar } from "../components/Navbar";
import { MovieCard } from "../components/MovieCard";
import MovieModal from "../components/MovieModal";
import { useApi } from "../context/ApiContext";
import { Episode, Movie, NextUpItem } from "../types";

const MIN_ROW_ITEMS = 6;
const ROW_LIMIT = 15;
const RECENT_DAYS = 30;
const TOP_RATED_MIN = 8.0;

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "";
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export default function HomePage() {
  const { data, refresh, triggerScan } = useMovies();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [heroImgError, setHeroImgError] = useState(false);
  const [lastWatched, setLastWatched] = useState<Movie[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [nextUp, setNextUp] = useState<NextUpItem[]>([]);
  const api = useApi();
  const navigate = useNavigate();
  const heroMovie = data?.content[0];

  useEffect(() => {
    void api
      .getRecentMovies()
      .then(setLastWatched)
      .catch(() => setLastWatched([]));
    void api
      .getNextUp(ROW_LIMIT)
      .then(setNextUp)
      .catch(() => setNextUp([]));
    void api
      .getMovies({
        addedSince: daysAgo(RECENT_DAYS),
        sortBy: "addedAt",
        sortOrder: "DESC",
        page: 0,
        size: ROW_LIMIT,
      })
      .then((page) => setRecentlyAdded(page.content))
      .catch(() => setRecentlyAdded([]));
    void api
      .getMovies({
        minRating: TOP_RATED_MIN,
        sortBy: "rating",
        sortOrder: "DESC",
        page: 0,
        size: 60,
      })
      .then((page) => setTopRated(page.content))
      .catch(() => setTopRated([]));
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
        <section className="relative isolate min-h-[540px] max-h-[600px] overflow-hidden border-b border-border bg-background sm:min-h-[620px] lg:min-h-[680px] dark:bg-[#101010]">
          {!heroImgError && heroMovie.cover_path ? (
            <img
              src={api.getThumbnailUrl(heroMovie.cover_path)}
              alt=""
              onError={() => setHeroImgError(true)}
              className="absolute inset-0 h-full w-full object-cover object-[center_25%] opacity-40 dark:opacity-55"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_40%,#5f1318_0%,var(--color-surface-hover)_42%,var(--color-surface)_85%)] dark:bg-[radial-gradient(circle_at_75%_40%,#5f1318_0%,#171717_42%,#090909_85%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent dark:from-[#080808] dark:via-[#080808]/80 dark:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent dark:via-transparent dark:to-black/35" />
          <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative mx-auto flex min-h-[540px] max-w-7xl items-end px-5 pb-14 pt-28 sm:min-h-[620px] sm:px-8 sm:pb-20 lg:min-h-[680px] lg:px-12">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground backdrop-blur-md dark:border-white/15 dark:bg-white/10 dark:text-white/90">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Featured
                tonight
              </div>
              <h1 className="line-clamp-2 max-w-xl text-4xl font-bold tracking-[-0.035em] text-foreground dark:text-white sm:text-5xl lg:text-7xl">
                {heroMovie.title}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-muted dark:text-white/75 sm:text-base">
                <span className="inline-flex items-center gap-1 text-amber-300">
                  <Star className="h-4 w-4 fill-current" />{" "}
                  {heroMovie.rating ? heroMovie.rating.toFixed(1) : "—"}
                </span>
                <span className="h-1 w-1 rounded-full bg-border dark:bg-white/50" />
                <span>
                  {heroMovie.release_date?.split("-")[0] || "New release"}
                </span>
                <span className="h-1 w-1 rounded-full bg-border dark:bg-white/50" />
                <span>{heroMovie.metadata?.resolution || "HD"}</span>
                {heroMovie.genres?.[0] && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-border dark:bg-white/50" />
                    <span>{heroMovie.genres[0]}</span>
                  </>
                )}
              </div>
              <p className="mt-5 max-w-lg text-sm leading-6 text-muted dark:text-white/75 sm:text-base sm:leading-7">
                Settle in for a great watch, streamed from your personal library
                in {heroMovie.metadata?.resolution || "high definition"}.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/watch/${heroMovie.id}`)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-xl transition hover:scale-[1.02] hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background sm:px-6 sm:text-base dark:bg-white dark:text-black dark:focus:ring-white dark:focus:ring-offset-black"
                >
                  <Play className="h-5 w-5 fill-current" /> Play now
                </button>
                <button
                  onClick={() => setSelectedMovie(heroMovie)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-bold text-foreground shadow-lg backdrop-blur-md transition hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary sm:px-6 sm:text-base dark:border-white/20 dark:bg-white/10 dark:text-white dark:focus:ring-white"
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
          <Row
            tag="Continue watching"
            title="Last watched"
            description="Your recently played titles"
          >
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
                    onPlay={() => navigate(`/watch/${movie.id}`)}
                  />
                </div>
              ))}
            </div>
          </Row>
        )}

        {nextUp.length > 0 && (
          <Row
            tag="Next up"
            title="Keep watching your shows"
            description="Pick up right where you left off"
          >
            <MovieRail>
              {nextUp.map((item) => (
                <div
                  key={item.episode.id}
                  className="w-56 shrink-0 snap-start sm:w-64 lg:w-72"
                >
                  <EpisodeCard
                    item={item}
                    onPlay={() => navigate(`/watch/episode/${item.episode.id}`)}
                  />
                </div>
              ))}
            </MovieRail>
          </Row>
        )}

        {recentlyAdded.length > 0 && (
          <Row
            tag="Fresh in the library"
            title="Recently added"
            description={`Added in the last ${RECENT_DAYS} days`}
          >
            <MovieRail>
              {recentlyAdded.slice(0, ROW_LIMIT).map((movie) => (
                <div
                  key={movie.id}
                  className="w-36 shrink-0 snap-start sm:w-44 lg:w-48"
                >
                  <MovieCard
                    movie={movie}
                    onClick={() => setSelectedMovie(movie)}
                    onPlay={() => navigate(`/watch/${movie.id}`)}
                  />
                </div>
              ))}
            </MovieRail>
          </Row>
        )}

        {topRated.length > 0 && (
          <Row
            tag="Critically acclaimed"
            title="Top rated"
            description={`Rated ${TOP_RATED_MIN.toFixed(1)}+`}
          >
            <MovieRail>
              {topRated.slice(0, ROW_LIMIT).map((movie) => (
                <div
                  key={movie.id}
                  className="w-36 shrink-0 snap-start sm:w-44 lg:w-48"
                >
                  <MovieCard
                    movie={movie}
                    onClick={() => setSelectedMovie(movie)}
                    onPlay={() => navigate(`/watch/${movie.id}`)}
                  />
                </div>
              ))}
            </MovieRail>
          </Row>
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

function Row({
  tag,
  title,
  description,
  children,
}: {
  tag: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-rise-in mb-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {tag}
          </p>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            {title}
          </h2>
        </div>
        {description && (
          <span className="hidden text-sm text-muted sm:block">
            {description}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function MovieRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:-mx-8 sm:gap-4 sm:px-8 lg:-mx-12 lg:px-12">
      {children}
    </div>
  );
}

function EpisodeCard({
  item,
  onPlay,
}: {
  item: NextUpItem;
  onPlay: () => void;
}) {
  const api = useApi();
  const [imgError, setImgError] = useState(false);
  const episode: Episode = item.episode;
  const coverUrl =
    episode.cover_path && !imgError
      ? api.getThumbnailUrl(episode.cover_path)
      : item.show.cover_path
        ? api.getThumbnailUrl(item.show.cover_path)
        : null;
  const label = `S${String(episode.season_number).padStart(2, "0")}E${String(
    episode.episode_number,
  ).padStart(2, "0")}`;

  return (
    <button
      onClick={onPlay}
      className="group relative flex aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-surface text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={episode.title || item.show.title}
          onError={() => setImgError(true)}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-surface-hover text-muted">
          <Film className="h-9 w-9 opacity-40" />
          <span className="mt-2 text-xs">No artwork</span>
        </div>
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
        <span className="flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-xl transition group-hover:scale-100 group-hover:opacity-100">
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          <Tv className="h-3.5 w-3.5" />
          {item.show.title}
        </span>
        <span className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
          <span className="inline-flex items-center gap-1 rounded bg-white/15 px-1.5 py-0.5 text-xs font-bold tracking-wide backdrop-blur-sm">
            {label}
          </span>
          <span className="truncate">{episode.title || "Next episode"}</span>
        </span>
        <span className="mt-2 flex items-center gap-3 text-xs text-white/70">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(episode.metadata?.durationSeconds) || "Stream now"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {item.show.release_date?.split("-")[0] || "New"}
          </span>
        </span>
      </span>
    </button>
  );
}

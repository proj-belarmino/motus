import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clapperboard,
  CornerDownLeft,
  Image as ImageIcon,
  LoaderCircle,
  Search,
  Star,
  X,
} from "lucide-react";
import { useApi } from "../context/ApiContext";
import { Movie } from "../types";

interface SearchOverlayProps {
  term: string;
  onTermChange: (term: string) => void;
  onClose: () => void;
  onCommit: (term: string) => void;
}

export default function SearchOverlay({
  term,
  onTermChange,
  onClose,
  onCommit,
}: SearchOverlayProps) {
  const api = useApi();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

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
    const trimmed = term.trim();
    const timeoutId = window.setTimeout(async () => {
      if (!trimmed) {
        if (!cancelled) {
          setResults([]);
          setLoading(false);
          setActiveIndex(-1);
        }
        return;
      }
      if (!cancelled) setLoading(true);
      try {
        const page = await api.getMovies({
          title: trimmed,
          page: 0,
          size: 12,
          sortBy: "title",
          sortOrder: "ASC",
        });
        if (!cancelled) {
          setResults(page.content);
          setActiveIndex(-1);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [term, api]);

  const close = () => onClose();

  const openMovie = (movie: Movie) => {
    onTermChange("");
    navigate(`/watch/${movie.id}`);
    close();
  };

  const commit = () => {
    onCommit(term.trim());
    close();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Enter") {
      event.preventDefault();
      const active = results[activeIndex];
      if (active) openMovie(active);
      else commit();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length ? (index + 1) % results.length : -1,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length ? (index - 1 + results.length) % results.length : -1,
      );
    }
  };

  const hasTerm = term.trim().length > 0;
  const showEmpty = hasTerm && !loading && results.length === 0;

  return (
    <div
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-label="Search your library"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />
      <div className="relative mx-auto mt-16 w-full max-w-2xl px-4 sm:mt-24">
        <div className="animate-rise-in overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border px-4 py-4 sm:px-5">
            <Search className="h-5 w-5 shrink-0 text-muted" />
            <input
              ref={inputRef}
              type="search"
              value={term}
              onChange={(event) => onTermChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search your library"
              aria-label="Search your library"
              className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted"
            />
            {loading ? (
              <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-muted" />
            ) : (
              hasTerm && (
                <button
                  onClick={() => onTermChange("")}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-surface-hover"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )
            )}
          </div>

          <div className="max-h-[min(60vh,480px)] overflow-y-auto p-2">
            {showEmpty ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <Clapperboard className="h-8 w-8 text-muted/60" />
                <div>
                  <p className="font-semibold text-foreground">
                    No titles match “{term.trim()}”
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Try a different title or check the spelling.
                  </p>
                </div>
              </div>
            ) : hasTerm && loading && results.length === 0 ? (
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
              results.map((movie, index) => (
                <SearchResultRow
                  key={movie.id}
                  movie={movie}
                  active={activeIndex === index}
                  onHover={() => setActiveIndex(index)}
                  onClick={() => openMovie(movie)}
                />
              ))
            )}
            {hasTerm && (
              <div className="flex items-center gap-4 px-2 py-2.5 text-[11px] text-muted">
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="h-3 w-3" /> Enter to search the
                  library
                </span>
                <span className="hidden sm:inline">↑↓ to navigate</span>
                <span>Esc to close</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchResultRow({
  movie,
  active,
  onHover,
  onClick,
}: {
  movie: Movie;
  active: boolean;
  onHover: () => void;
  onClick: () => void;
}) {
  const api = useApi();
  const [imgError, setImgError] = useState(false);
  const coverUrl =
    movie.cover_path && !imgError
      ? api.getThumbnailUrl(movie.cover_path)
      : null;
  const year = movie.release_date ? movie.release_date.split("-")[0] : "New";
  const resolution = movie.metadata?.resolution || "HD";

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${
        active ? "bg-surface-hover" : ""
      }`}
    >
      <span className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-4 w-4 text-muted/50" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">
          {movie.title}
        </span>
        <span className="mt-0.5 block text-xs text-muted">
          {year} · {resolution}
          {movie.genres?.[0] ? ` · ${movie.genres[0]}` : ""}
        </span>
      </span>
      {movie.rating ? (
        <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-amber-300">
          <Star className="h-3.5 w-3.5 fill-current" /> {movie.rating}
        </span>
      ) : null}
    </button>
  );
}

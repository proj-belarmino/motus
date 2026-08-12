import React, { useState } from "react";
import {
  Bookmark,
  Heart,
  Image as ImageIcon,
  Info,
  Play,
  Star,
} from "lucide-react";
import { useApi } from "../context/ApiContext";
import { Movie } from "../types";

export const MovieCard: React.FC<{
  movie: Movie;
  onClick: () => void;
  onPlay?: () => void;
  favorited?: boolean;
  inWatchlist?: boolean;
  onChanged?: (kind: "favorite" | "watchlist", value: boolean) => void;
}> = ({
  movie,
  onClick,
  onPlay,
  favorited = false,
  inWatchlist = false,
  onChanged,
}) => {
  const api = useApi();
  const [imgError, setImgError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(favorited);
  const [isWatchlisted, setIsWatchlisted] = useState(inWatchlist);
  const [toggling, setToggling] = useState<"favorite" | "watchlist" | null>(
    null,
  );
  const coverUrl =
    movie.cover_path && !imgError
      ? api.getThumbnailUrl(movie.cover_path)
      : null;
  const year = movie.release_date ? movie.release_date.split("-")[0] : "New";
  const rating = movie.rating ? movie.rating.toFixed(1) : null;

  const handleToggle = async (kind: "favorite" | "watchlist") => {
    setToggling(kind);
    try {
      const value =
        kind === "favorite"
          ? await api.toggleFavorite(movie.id)
          : await api.toggleWatchlist(movie.id);
      if (kind === "favorite") setIsFavorite(value);
      else setIsWatchlisted(value);
      onChanged?.(kind, value);
    } catch {
      // Ignore toggle failures; state stays unchanged.
    } finally {
      setToggling(null);
    }
  };

  const handleAction =
    (action: () => void): React.MouseEventHandler =>
    (event) => {
      event.stopPropagation();
      event.preventDefault();
      action();
    };

  return (
    <div className="group relative aspect-[2/3] h-full w-full overflow-hidden rounded-xl border border-border bg-surface text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl">
      <button
        onClick={onPlay}
        className="absolute inset-0 z-0 h-full w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={movie.title}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-surface-hover text-muted">
            <ImageIcon className="h-9 w-9 opacity-40" />
            <span className="mt-2 text-xs">No artwork</span>
          </div>
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
          <span className="flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-xl transition group-hover:scale-100 group-hover:opacity-100">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        </span>
        <span className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <span className="block truncate text-sm font-bold text-white drop-shadow-md sm:text-base">
            {movie.title}
          </span>
          <span className="mt-1.5 flex items-center justify-between text-xs text-white/80 drop-shadow-md">
            <span>
              {year} · {movie.metadata?.resolution || "HD"}
            </span>
            {rating && (
              <span className="flex items-center gap-1 font-medium text-amber-300">
                <Star className="h-3 w-3 fill-current" /> {rating}
              </span>
            )}
          </span>
        </span>
      </button>

      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5 sm:right-3 sm:top-3">
        <button
          onClick={handleAction(() => void handleToggle("favorite"))}
          disabled={toggling !== null}
          aria-label={
            isFavorite ? "Remove from favourites" : "Add to favourites"
          }
          title={isFavorite ? "Remove from favourites" : "Add to favourites"}
          className={`flex h-9 w-9 items-center justify-center rounded-full shadow-lg backdrop-blur-md transition hover:scale-110 disabled:cursor-wait disabled:opacity-60 ${isFavorite ? "bg-primary text-white" : "bg-black/45 text-white hover:bg-primary"}`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
        </button>
        <button
          onClick={handleAction(() => void handleToggle("watchlist"))}
          disabled={toggling !== null}
          aria-label={
            isWatchlisted ? "Remove from watchlist" : "Add to watchlist"
          }
          title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
          className={`flex h-9 w-9 items-center justify-center rounded-full shadow-lg backdrop-blur-md transition hover:scale-110 disabled:cursor-wait disabled:opacity-60 ${isWatchlisted ? "bg-primary text-white" : "bg-black/45 text-white hover:bg-primary"}`}
        >
          <Bookmark
            className={`h-4 w-4 ${isWatchlisted ? "fill-current" : ""}`}
          />
        </button>
        <button
          onClick={handleAction(onClick)}
          aria-label="Show details"
          title="Show details"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur-md transition hover:scale-110 hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

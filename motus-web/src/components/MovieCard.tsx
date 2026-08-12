import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bookmark,
  Clock,
  Clapperboard,
  Heart,
  Image as ImageIcon,
  Play,
  Star,
} from "lucide-react";
import { useApi } from "../context/ApiContext";
import { Movie } from "../types";

const HOVER_DELAY_MS = 500;

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "";
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function audioLabel(codec?: string): string {
  if (!codec) return "";
  const normalized = codec.toLowerCase();
  if (normalized.includes("eac3") || normalized.includes("ec3")) return "5.1 Ch";
  if (normalized.includes("ac3")) return "5.1 Ch";
  if (normalized.includes("dts")) return "5.1 Ch";
  if (normalized.includes("truehd")) return "Atmos";
  return codec.trim();
}

export const MovieCard: React.FC<{
  movie: Movie;
  onClick: () => void;
  favorited?: boolean;
  inWatchlist?: boolean;
  onChanged?: (kind: "favorite" | "watchlist", value: boolean) => void;
}> = ({
  movie,
  onClick,
  favorited = false,
  inWatchlist = false,
  onChanged,
}) => {
  const api = useApi();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(favorited);
  const [isWatchlisted, setIsWatchlisted] = useState(inWatchlist);
  const [toggling, setToggling] = useState<"favorite" | "watchlist" | null>(
    null,
  );
  const [cardHover, setCardHover] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coverUrl =
    movie.cover_path && !imgError
      ? api.getThumbnailUrl(movie.cover_path)
      : null;
  const year = movie.release_date ? movie.release_date.split("-")[0] : "New";

  const handleHoverStart = () => {
    setCardHover(true);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setMenuVisible(true), HOVER_DELAY_MS);
  };

  const handleHoverEnd = () => {
    setCardHover(false);
    setMenuVisible(false);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  };

  useEffect(
    () => () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    },
    [],
  );

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

  const subtitleLanguages = Array.from(
    new Set(
      (movie.subtitles ?? [])
        .map((subtitle) =>
          subtitle.language
            ? subtitle.language.toUpperCase().padEnd(2).slice(0, 2)
            : "",
        )
        .filter(Boolean),
    ),
  ).join("/");
  const audioInfo = audioLabel(movie.metadata?.audioCodec);
  const subInfo = subtitleLanguages ? `${subtitleLanguages} Subs` : "";

  return (
    <div
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      className={`group relative aspect-[2/3] ${
        cardHover ? "z-10" : ""
      } h-full w-full overflow-visible outline-none`}
    >
      <div
        className={`absolute inset-0 overflow-hidden rounded-xl border bg-surface transition duration-300 group-hover:border-primary/50 group-hover:shadow-xl ${
          cardHover
            ? "border-primary/70 shadow-2xl"
            : "border-border shadow-sm group-hover:-translate-y-1"
        }`}
      >
        <button
          onClick={onClick}
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
          <span className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-90" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
            <span className="flex h-11 w-11 scale-90 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-xl transition group-hover:scale-100 group-hover:opacity-100">
              <Play className="ml-0.5 h-5 w-5 fill-current" />
            </span>
          </span>
          <span className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
            <span className="block truncate text-sm font-bold text-white sm:text-base">
              {movie.title}
            </span>
            <span className="mt-1.5 flex items-center justify-between text-xs text-white/70">
              <span>
                {year} · {movie.metadata?.resolution || "HD"}
              </span>
              {movie.rating ? (
                <span className="flex items-center gap-1 font-medium text-amber-300">
                  <Star className="h-3 w-3 fill-current" /> {movie.rating}
                </span>
              ) : null}
            </span>
          </span>
        </button>

        <div
          className={`absolute right-2 top-2 z-10 flex flex-col gap-1.5 transition-opacity duration-200 sm:right-3 sm:top-3 ${
            menuVisible ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <button
            onClick={handleAction(() => void handleToggle("favorite"))}
            disabled={toggling !== null}
            aria-label={
              isFavorite ? "Remove from favourites" : "Add to favourites"
            }
            title={isFavorite ? "Remove from favourites" : "Add to favourites"}
            className={`flex h-9 w-9 items-center justify-center rounded-full shadow-lg backdrop-blur-md transition hover:scale-110 disabled:cursor-wait disabled:opacity-60 ${isFavorite ? "bg-primary text-white" : "bg-black/45 text-white hover:bg-primary"}`}
          >
            <Heart
              className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
            />
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
        </div>
      </div>

      <div
        className={`pointer-events-auto absolute inset-0 z-20 transition-opacity duration-200 ${
          menuVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="rounded-b-xl bg-gradient-to-t from-black via-black/95 to-black/85 px-3.5 pb-3 pt-2.5 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-sm font-bold leading-snug text-white">
                {movie.title}
              </span>
              {movie.rating ? (
                <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-amber-300">
                  <Star className="h-3 w-3 fill-current" /> {movie.rating}
                </span>
              ) : null}
            </span>
            <button
              onClick={handleAction(() => navigate(`/watch/${movie.id}`))}
              title="Play now"
              aria-label="Play now"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-lg transition hover:scale-110 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </button>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-white/75">
            <span className="inline-flex items-center gap-1">
              <Clapperboard className="h-3 w-3" />
              {movie.metadata?.resolution || "HD"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(movie.metadata?.durationSeconds)}
            </span>
          </div>

          {audioInfo || subInfo ? (
            <div className="mt-1.5 text-[11px] font-medium text-white/55">
              {[audioInfo, subInfo].filter(Boolean).join(" · ")}
            </div>
          ) : null}

          <div className="mt-2.5 flex gap-2">
            <button
              onClick={handleAction(() => void handleToggle("favorite"))}
              disabled={toggling !== null}
              aria-label={
                isFavorite ? "Remove from favourites" : "Add to favourites"
              }
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
                isFavorite
                  ? "bg-primary/90 text-white hover:bg-primary"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Heart
                className={`h-3 w-3 ${isFavorite ? "fill-current" : ""}`}
              />
              {isFavorite ? "Favourited" : "Favourite"}
            </button>
            <button
              onClick={handleAction(() => void handleToggle("watchlist"))}
              disabled={toggling !== null}
              aria-label={
                isWatchlisted ? "Remove from watchlist" : "Add to watchlist"
              }
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
                isWatchlisted
                  ? "bg-primary/90 text-white hover:bg-primary"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Bookmark
                className={`h-3 w-3 ${isWatchlisted ? "fill-current" : ""}`}
              />
              {isWatchlisted ? "Saved" : "Watchlist"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
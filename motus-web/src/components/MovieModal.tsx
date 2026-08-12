import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Play, HardDrive, Film, FileVideo, RefreshCw, Edit2, Check, AlertTriangle, Trash2, LoaderCircle, Captions, Upload, Heart, Bookmark } from "lucide-react";
import { Movie } from "../types";
import { useApi } from "../context/ApiContext";

export default function MovieModal({
  movie: initialMovie,
  onClose,
  onUpdate,
}: {
  movie: Movie;
  onClose: () => void;
  onUpdate?: () => void;
}) {
  const api = useApi();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie>(initialMovie);
  const [imgError, setImgError] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(movie.title);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [subtitleUploading, setSubtitleUploading] = useState(false);
  const [subtitleError, setSubtitleError] = useState("");
  const [removingSubtitleId, setRemovingSubtitleId] = useState("");
  const subtitleFileInput = useRef<HTMLInputElement>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState<"favorite" | "watchlist" | null>(null);

  useEffect(() => {
    void Promise.all([api.isFavorite(movie.id), api.isInWatchlist(movie.id)])
      .then(([favorited, watchlisted]) => { setIsFavorite(favorited); setIsWatchlisted(watchlisted); })
      .catch(() => undefined);
  }, [api, movie.id]);

  const toggleBookmark = async (kind: "favorite" | "watchlist") => {
    setSavingBookmark(kind);
    try {
      const value = kind === "favorite" ? await api.toggleFavorite(movie.id) : await api.toggleWatchlist(movie.id);
      if (kind === "favorite") setIsFavorite(value);
      else setIsWatchlisted(value);
    } catch {
      // Ignore toggle failures; state stays unchanged.
    } finally {
      setSavingBookmark(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const updated = await api.refreshMovie(movie.id);
      setMovie(updated);
      setImgError(false);
      setRefreshKey(Date.now());
      setHasChanges(true);
      setFeedback("Artwork and metadata refreshed.");
    } catch (err) {
      console.error(err);
      alert("Failed to refresh movie.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRename = async () => {
    if (newTitle.trim() === movie.title) {
      setIsRenaming(false);
      return;
    }
    setIsSaving(true);
    try {
      const updated = await api.updateMovieTitle(movie.id, newTitle.trim());
      setMovie(updated);
      setIsRenaming(false);
      setHasChanges(true);
      setFeedback("Title updated.");
    } catch (err) {
      console.error(err);
      alert("Failed to rename movie.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== movie.title) return;
    try {
      setIsDeleting(true);
      await api.deleteMovie(movie.id);
      setHasChanges(true);
      onUpdate?.();
      onClose();
    } catch {
      setFeedback("Could not delete this title. Please try again.");
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleSubtitleUpload = async (file?: File) => {
    if (!file) return;
    if (!/\.(srt|vtt)$/i.test(file.name)) {
      setSubtitleError("Subtitle files must be .srt or .vtt.");
      return;
    }
    setSubtitleUploading(true);
    setSubtitleError("");
    try {
      const updated = await api.uploadSubtitle(movie.id, file);
      setMovie(updated);
      setHasChanges(true);
      setFeedback(`Subtitle "${file.name}" attached.`);
    } catch {
      setSubtitleError("Could not upload the subtitle file. Please try again.");
    } finally {
      setSubtitleUploading(false);
    }
  };

  const handleSubtitleDelete = async (subtitleId: string) => {
    setRemovingSubtitleId(subtitleId);
    try {
      const updated = await api.deleteSubtitle(movie.id, subtitleId);
      setMovie(updated);
      setHasChanges(true);
      setFeedback("Subtitle removed.");
    } catch {
      setFeedback("Could not remove this subtitle. Please try again.");
    } finally {
      setRemovingSubtitleId("");
    }
  };

  const handleClose = () => {
    if (hasChanges && onUpdate) {
      onUpdate();
    }
    onClose();
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (deleteOpen) setDeleteOpen(false);
        else handleClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  });

  const coverUrl =
    movie.cover_path && !imgError
      ? api.getThumbnailUrl(movie.cover_path) + `?t=${refreshKey}`
      : null;

  const metadata = movie.metadata || {};
  const durationMins = metadata.durationSeconds
    ? Math.round(metadata.durationSeconds / 60)
    : 0;
  const bitRateMbps = metadata.bitrate
    ? (metadata.bitrate / 1000000).toFixed(2)
    : "0.00";

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-label={`${movie.title} details`}>
      <div className="animate-rise-in relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        <button
          onClick={handleClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/80 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close movie details"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="relative h-60 w-full shrink-0 bg-black sm:h-[40vh]">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt=""
              onError={() => setImgError(true)}
              className="h-full w-full object-cover opacity-80"
            />
          ) : (
            <div className="h-full w-full bg-surface-hover flex items-center justify-center">
              <Film className="h-20 w-20 text-muted opacity-30" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

          <div className="absolute bottom-5 left-5 flex items-center space-x-4 sm:bottom-6 sm:left-8">
            <button
              onClick={() => navigate(`/watch/${movie.id}`)}
              className="flex items-center space-x-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-white shadow-lg transition hover:scale-[1.02] hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-white sm:px-8"
            >
              <Play className="h-6 w-6 fill-white" />
              <span>Play</span>
            </button>
            <button
              onClick={() => void toggleBookmark("favorite")}
              disabled={savingBookmark !== null}
              title={isFavorite ? "Remove from favourites" : "Add to favourites"}
              aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border backdrop-blur-md shadow-lg transition hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-wait disabled:opacity-60 ${isFavorite ? "border-primary bg-primary text-white" : "border-white/25 bg-black/40 text-white hover:bg-primary"}`}
            >
              {savingBookmark === "favorite" ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />}
            </button>
            <button
              onClick={() => void toggleBookmark("watchlist")}
              disabled={savingBookmark !== null}
              title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
              aria-label={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border backdrop-blur-md shadow-lg transition hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-wait disabled:opacity-60 ${isWatchlisted ? "border-primary bg-primary text-white" : "border-white/25 bg-black/40 text-white hover:bg-primary"}`}
            >
              {savingBookmark === "watchlist" ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Bookmark className={`h-5 w-5 ${isWatchlisted ? "fill-current" : ""}`} />}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-6 text-foreground sm:px-8">
          {feedback && <div className="animate-rise-in mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300"><span className="flex items-center gap-2"><Check className="h-4 w-4" />{feedback}</span><button onClick={() => setFeedback("")} aria-label="Dismiss message"><X className="h-4 w-4" /></button></div>}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {isRenaming ? (
              <div className="flex items-center space-x-2 w-full max-w-lg">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-1 text-2xl font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') {
                      setIsRenaming(false);
                      setNewTitle(movie.title);
                    }
                  }}
                  disabled={isSaving}
                />
                <button
                  onClick={handleRename}
                  disabled={isSaving}
                  className="rounded bg-primary p-2 text-white hover:bg-primary-hover disabled:opacity-50"
                  title="Save"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setIsRenaming(false);
                    setNewTitle(movie.title);
                  }}
                  disabled={isSaving}
                  className="rounded bg-surface-hover p-2 text-foreground hover:bg-border disabled:opacity-50"
                  title="Cancel"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <h2 className="text-2xl font-bold sm:text-3xl">{movie.title}</h2>
                <button
                  onClick={() => {
                    setNewTitle(movie.title);
                    setIsRenaming(true);
                  }}
                  className="rounded-full p-2 text-muted hover:bg-surface-hover hover:text-foreground"
                  title="Rename Title"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              </div>
            )}

            {!isRenaming && <div className="flex gap-2"><button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center space-x-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-hover disabled:opacity-50" title="Regenerate thumbnail and fetch metadata"><RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} /><span className="hidden sm:inline">Refresh</span></button><button onClick={() => { setDeleteConfirmation(""); setDeleteOpen(true); }} className="flex items-center gap-2 rounded-xl border border-red-500/25 px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500/10" title="Delete movie"><Trash2 className="h-4 w-4" /><span className="hidden sm:inline">Delete</span></button></div>}
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm font-medium text-muted">
            <span className="text-green-500 font-bold">
              {(movie.rating * 10).toFixed(0)}% Match
            </span>
            <span>{movie.release_date?.split("-")[0] || "Unknown Year"}</span>
            <span className="rounded border border-border bg-surface px-2 py-0.5 text-xs text-foreground font-semibold">
              {metadata.resolution || "HD"}
            </span>
            <span>{durationMins}m</span>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="col-span-2 space-y-4">
              <p className="text-sm leading-relaxed text-foreground/90">
                Experience the magic of {movie.title}. Streaming live from Motus
                with zero latency.
              </p>

              <div className="mt-6 rounded-lg border border-border bg-surface p-4 space-y-3">
                <h3 className="font-semibold text-foreground flex items-center space-x-2 mb-4">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <span>File Metadata</span>
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted block text-xs uppercase tracking-wider mb-1">
                      Video Codec
                    </span>
                    <span className="font-medium">
                      {metadata.videoCodec || "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-xs uppercase tracking-wider mb-1">
                      Audio Codec
                    </span>
                    <span className="font-medium">
                      {metadata.audioCodec || "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-xs uppercase tracking-wider mb-1">
                      File Size
                    </span>
                    <span className="font-medium">
                      {formatFileSize(metadata.fileSize)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-xs uppercase tracking-wider mb-1">
                      Bitrate
                    </span>
                    <span className="font-medium">{bitRateMbps} Mbps</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground flex items-center space-x-2">
                    <Captions className="h-4 w-4 text-primary" />
                    <span>Subtitles</span>
                  </h3>
                  <button onClick={() => subtitleFileInput.current?.click()} disabled={subtitleUploading} className="flex items-center space-x-2 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-hover disabled:opacity-50" title="Upload subtitles">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{subtitleUploading ? "Uploading…" : "Upload .srt / .vtt"}</span>
                  </button>
                  <input ref={subtitleFileInput} type="file" accept=".srt,.vtt,text/vtt,application/x-subrip" className="hidden" onChange={(event) => { void handleSubtitleUpload(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                </div>

                {subtitleError && <p className="text-xs font-medium text-red-500">{subtitleError}</p>}

                {movie.subtitles?.length ? (
                  <ul className="space-y-1.5">
                    {movie.subtitles.map((subtitle) => (
                      <li key={subtitle.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">{subtitle.language}</span>
                          <span className="truncate text-sm font-medium">{subtitle.label}</span>
                        </span>
                        <button onClick={() => void handleSubtitleDelete(subtitle.id)} disabled={removingSubtitleId === subtitle.id} className="rounded-lg p-1.5 text-muted transition hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50" title="Remove subtitle">
                          {removingSubtitleId === subtitle.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No subtitles attached yet. Upload an .srt or .vtt file to enable captions during playback.</p>
                )}
              </div>
            </div>

            <div className="col-span-1 flex flex-col space-y-4 text-sm">
              <div>
                <span className="text-muted block mb-1">Director</span>
                <span className="font-medium">
                  {movie.director || "Unknown"}
                </span>
              </div>
              <div>
                <span className="text-muted block mb-1">Genres</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {movie.genres?.length ? (
                    movie.genres.map((g) => (
                      <span
                        key={g}
                        className="bg-surface-hover border border-border rounded px-2 py-0.5 text-xs"
                      >
                        {g}
                      </span>
                    ))
                  ) : (
                    <span className="font-medium">Various</span>
                  )}
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-border">
                <span className="text-muted block mb-1 flex items-center gap-1">
                  <FileVideo className="h-4 w-4" /> Path
                </span>
                <span className="font-mono text-xs text-muted break-all">
                  {movie.file_path}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {deleteOpen && <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="animate-rise-in w-full max-w-md rounded-2xl border border-red-500/25 bg-surface p-6 shadow-2xl"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-500"><AlertTriangle className="h-5 w-5" /></div><h3 className="mt-4 text-xl font-bold">Delete this film?</h3><p className="mt-2 text-sm leading-6 text-muted">This removes <b className="text-foreground">{movie.title}</b> from your library. Type the full title below to confirm.</p><input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder={movie.title} autoFocus className="mt-5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" /><div className="mt-5 flex justify-end gap-3"><button onClick={() => setDeleteOpen(false)} disabled={isDeleting} className="rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-surface-hover">Cancel</button><button onClick={handleDelete} disabled={deleteConfirmation !== movie.title || isDeleting} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40">{isDeleting && <LoaderCircle className="h-4 w-4 animate-spin" />}Delete film</button></div></div></div>}
    </div>
  );
}

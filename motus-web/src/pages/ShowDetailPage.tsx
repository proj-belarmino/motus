import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Film,
  Play,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  Tv,
  Upload,
  X,
} from "lucide-react";
import { useApi } from "../context/ApiContext";
import { Episode, Show } from "../types";

const detailCache = new Map<string, Show>();

export default function ShowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [show, setShow] = useState<Show | null>(
    detailCache.get(id ?? "") ?? null,
  );
  const [error, setError] = useState("");
  const [deleteArmed, setDeleteArmed] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [season, setSeason] = useState("");
  const [episode, setEpisode] = useState("");
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState("");

  const loadShow = useCallback(async () => {
    if (!id) return;
    try {
      const result = await api.getShow(id);
      detailCache.set(id, result);
      setShow(result);
      setError("");
    } catch {
      setError("This show could not be loaded.");
    }
  }, [api, id]);

  useEffect(() => {
    // This page owns the show detail request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadShow();
  }, [loadShow]);

  const handleUpload = async () => {
    if (!id || !selectedFile) return;
    setUploading(true);
    try {
      const updated = await api.uploadEpisode(
        id,
        selectedFile,
        season ? Number(season) : undefined,
        episode ? Number(episode) : undefined,
      );
      setShow(updated);
      setUploadOpen(false);
      setSelectedFile(null);
      setSeason("");
      setEpisode("");
    } catch {
      setError("Could not upload this episode. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEpisode = async (episodeId: string) => {
    if (!id) return;
    setRemovingId(episodeId);
    try {
      setShow(await api.deleteEpisode(id, episodeId));
    } catch {
      setError("Could not remove this episode.");
    } finally {
      setRemovingId("");
    }
  };

  const handleDeleteShow = async () => {
    if (!id) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }
    try {
      await api.deleteShow(id);
      navigate("/shows");
    } catch {
      setError("Could not delete this show.");
      setDeleteArmed(false);
    }
  };

  const seasons = useMemo(() => {
    if (!show) return [];
    const grouped = new Map<number, Episode[]>();
    for (const episode of show.episodes) {
      const list = grouped.get(episode.season_number) ?? [];
      list.push(episode);
      grouped.set(episode.season_number, list);
    }
    return [...grouped.entries()].sort((a, b) => a[0] - b[0]);
  }, [show]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5 text-center">
        <div className="animate-rise-in max-w-md rounded-2xl border border-red-500/25 bg-red-500/5 p-8">
          <p className="font-semibold text-foreground">
            This show could not be loaded
          </p>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <button
            onClick={() => void loadShow()}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-soft-pulse h-64 w-44 rounded-2xl bg-surface-hover" />
      </div>
    );
  }

  const year = show.release_date ? show.release_date.split("-")[0] : "New";
  const coverUrl = show.cover_path
    ? api.getThumbnailUrl(show.cover_path)
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/shows")}
              className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-surface-hover"
              aria-label="Back to shows"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                TV Shows
              </p>
              <h1 className="truncate text-xl font-bold tracking-tight">
                {show.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadShow()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border transition hover:bg-surface-hover"
              aria-label="Refresh show"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => void handleDeleteShow()}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${deleteArmed ? "border-red-600 bg-red-600 text-white" : "border-red-500/25 text-red-500 hover:bg-red-500/10"}`}
            >
              <Trash2 className="h-4 w-4" />
              {deleteArmed ? "Confirm delete?" : "Delete"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-7 sm:px-8 sm:pt-9 lg:px-12">
        <section className="relative isolate overflow-hidden rounded-2xl border border-border bg-[#101010] shadow-sm">
          {coverUrl && (
            <img
              src={coverUrl}
              alt=""
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
              className="absolute inset-0 h-full w-full object-cover opacity-25"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/75 to-transparent" />
          <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:p-8">
            <div className="flex h-48 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/50 shadow-lg sm:h-60 sm:w-40">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Film className="h-10 w-10 text-white/30" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-white/75">
                <span className="inline-flex items-center gap-1 text-amber-300">
                  <Star className="h-3.5 w-3.5 fill-current" />{" "}
                  {show.rating || "—"}
                </span>
                <span className="h-1 w-1 rounded-full bg-white/40" />
                <span>{year}</span>
                {show.status && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/40" />
                    <span>{show.status}</span>
                  </>
                )}
                <span className="h-1 w-1 rounded-full bg-white/40" />
                <span>{show.episodes.length} episodes</span>
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {show.title}
              </h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {show.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/85 backdrop-blur-md"
                  >
                    {genre}
                  </span>
                ))}
              </div>
              {show.overview && (
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75">
                  {show.overview}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Episodes
              </p>
              <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
                Seasons & episodes
              </h3>
            </div>
            <button
              onClick={() => setUploadOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4" /> Add episode
            </button>
          </div>

          {uploadOpen && (
            <div className="animate-rise-in mb-6 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold">Upload an episode file</p>
                <button
                  onClick={() => setUploadOpen(false)}
                  className="rounded-lg p-1 text-muted hover:bg-surface-hover"
                  aria-label="Close upload"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_8rem_auto] sm:items-center">
                <button
                  onClick={() => fileInput.current?.click()}
                  className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground transition hover:border-primary/50 hover:bg-surface-hover"
                >
                  <Upload className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">
                    {selectedFile ? selectedFile.name : "Choose video file"}
                  </span>
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(event) => {
                    setSelectedFile(event.target.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                />
                <input
                  type="number"
                  min="1"
                  value={season}
                  onChange={(event) => setSeason(event.target.value)}
                  placeholder="Season"
                  aria-label="Season number"
                  className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="number"
                  min="1"
                  value={episode}
                  onChange={(event) => setEpisode(event.target.value)}
                  placeholder="Episode"
                  aria-label="Episode number"
                  className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={() => void handleUpload()}
                  disabled={!selectedFile || uploading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Upload className="h-4 w-4" />{" "}
                  {uploading ? "Uploading…" : "Upload"}
                </button>
              </div>
              <p className="mt-3 text-xs text-muted">
                Leave season/episode blank to auto-detect them from the filename
                (e.g. S01E03).
              </p>
            </div>
          )}

          {show.episodes.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 text-center text-muted">
              <Tv className="mb-3 h-8 w-8 opacity-50" />
              <p className="font-medium text-foreground">No episodes yet</p>
              <p className="mt-1 text-sm">
                Upload the first episode to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {seasons.map(([seasonNumber, episodes]) => (
                <div key={seasonNumber}>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                    <Calendar className="h-4 w-4 text-primary" /> Season{" "}
                    {seasonNumber}
                  </h4>
                  <div className="space-y-2">
                    {episodes.map((episode) => (
                      <EpisodeRow
                        key={episode.id}
                        episode={episode}
                        coverUrl={
                          episode.cover_path
                            ? api.getThumbnailUrl(episode.cover_path)
                            : null
                        }
                        removing={removingId === episode.id}
                        onPlay={() => navigate(`/watch/episode/${episode.id}`)}
                        onDelete={() => void handleDeleteEpisode(episode.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function EpisodeRow({
  episode,
  coverUrl,
  removing,
  onPlay,
  onDelete,
}: {
  episode: Episode;
  coverUrl: string | null;
  removing: boolean;
  onPlay: () => void;
  onDelete: () => void;
}) {
  const [thumbError, setThumbError] = useState(false);
  const minutes = episode.metadata?.durationSeconds
    ? Math.round(episode.metadata.durationSeconds / 60)
    : 0;

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5 shadow-sm transition hover:border-primary/30 hover:bg-surface-hover sm:gap-4 sm:p-3">
      <button
        onClick={onPlay}
        className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-surface-hover sm:h-20 sm:w-36"
        aria-label={`Play S${episode.season_number}E${episode.episode_number}`}
      >
        {coverUrl && !thumbError ? (
          <img
            src={coverUrl}
            alt=""
            onError={() => setThumbError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted">
            <Film className="h-5 w-5 opacity-40" />
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-lg transition group-hover:opacity-100">
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          </span>
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          S{String(episode.season_number).padStart(2, "0")}E
          {String(episode.episode_number).padStart(2, "0")}
        </p>
        <p className="mt-0.5 truncate font-semibold text-foreground">
          {episode.title || episode.file_path.split(/[/\\]/).pop()}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {minutes ? `${minutes}m` : ""}
          {episode.metadata?.resolution
            ? ` · ${episode.metadata.resolution}`
            : ""}
        </p>
      </div>
      <button
        onClick={onDelete}
        disabled={removing}
        className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-red-500/10 hover:text-red-500 disabled:cursor-wait disabled:opacity-50"
        aria-label="Delete episode"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

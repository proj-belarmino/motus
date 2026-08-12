import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Captions,
  ChevronDown,
  Gauge,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useApi } from "../context/ApiContext";
import { Movie } from "../types";

const SKIP_SECONDS = 10;

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds}`
    : `${minutes}:${remainingSeconds}`;
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = useApi();
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeout = useRef<number | null>(null);
  const activityRecorded = useRef(false);
  const subtitleTrackRefs = useRef<Map<string, HTMLTrackElement>>(new Map());
  const [movie, setMovie] = useState<Movie | null>(null);
  const [activeSubtitleId, setActiveSubtitleId] = useState<string | null>(null);
  const [transcode, setTranscode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const streamUrl = api.getStreamUrl(id ?? "", transcode);

  const applySubtitleSelection = useCallback((video: HTMLVideoElement, subtitleId: string | null) => {
    const tracks = video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const target = subtitleId ? subtitleTrackRefs.current.get(subtitleId) : undefined;
      track.mode = target && target.track === track ? "showing" : "disabled";
    }
  }, []);

  const selectSubtitle = useCallback((subtitleId: string | null) => {
    setActiveSubtitleId(subtitleId);
    const video = videoRef.current;
    if (video) applySubtitleSelection(video, subtitleId);
  }, [applySubtitleSelection]);

  useEffect(() => {
    if (!id) return;
    api.getMovie(id).then(setMovie).catch(() => undefined);
  }, [id, api]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) applySubtitleSelection(video, activeSubtitleId);
  }, [activeSubtitleId, movie, applySubtitleSelection]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout.current) window.clearTimeout(controlsTimeout.current);
    controlsTimeout.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3200);
  }, []);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
    revealControls();
  }, [revealControls]);

  const seekBy = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), video.duration || 0);
    revealControls();
  }, [revealControls]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await playerRef.current?.requestFullscreen();
    } catch {
      // Some embedded browsers do not permit the Fullscreen API.
    }
  }, []);

  const togglePictureInPicture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !("pictureInPictureEnabled" in document)) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      // Picture-in-picture is not available for every browser or video source.
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "SELECT") return;
      if (event.key === " " || event.key.toLowerCase() === "k") {
        event.preventDefault();
        togglePlayback();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        seekBy(-SKIP_SECONDS);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        seekBy(SKIP_SECONDS);
      } else if (event.key.toLowerCase() === "f") {
        void toggleFullscreen();
      } else if (event.key.toLowerCase() === "m") {
        const video = videoRef.current;
        if (video) video.muted = !video.muted;
      }
    };
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (controlsTimeout.current) window.clearTimeout(controlsTimeout.current);
    };
  }, [seekBy, toggleFullscreen, togglePlayback]);

  if (!id) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const bufferProgress = duration ? (buffered / duration) * 100 : 0;

  return (
    <main
      ref={playerRef}
      className="group/player relative flex h-dvh w-full select-none items-center justify-center overflow-hidden bg-[#070707] text-white"
      onMouseMove={revealControls}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        key={streamUrl}
        src={streamUrl}
        autoPlay
        crossOrigin="anonymous"
        className="h-full w-full object-contain outline-none"
        onClick={togglePlayback}
        onPlay={() => { setIsPlaying(true); revealControls(); if (!activityRecorded.current) { activityRecorded.current = true; void api.recordActivity(id).catch(() => undefined); } }}
        onPause={() => { setIsPlaying(false); setShowControls(true); }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          setDuration(video.duration);
          applySubtitleSelection(video, activeSubtitleId);
        }}
        onProgress={(event) => {
          const video = event.currentTarget;
          if (video.buffered.length) setBuffered(video.buffered.end(video.buffered.length - 1));
        }}
        onVolumeChange={(event) => {
          setVolume(event.currentTarget.volume);
          setIsMuted(event.currentTarget.muted);
        }}
      >
        {movie?.subtitles?.map((subtitle) => (
          <track
            key={subtitle.id}
            ref={(element) => {
              if (element) subtitleTrackRefs.current.set(subtitle.id, element);
              else subtitleTrackRefs.current.delete(subtitle.id);
            }}
            kind="subtitles"
            src={api.getSubtitleUrl(movie.id, subtitle.id)}
            srcLang={subtitle.language}
            label={subtitle.label}
          />
        ))}
      </video>

      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`} />

      <header className={`absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4 sm:p-6 transition-all duration-300 ${showControls ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"}`}>
        <button
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white shadow-lg backdrop-blur-md transition hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="rounded-full border border-white/10 bg-black/35 px-4 py-2 text-sm font-medium tracking-wide shadow-lg backdrop-blur-md">
          Now playing
        </div>
        <button
          onClick={() => setShowSettings((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white shadow-lg backdrop-blur-md transition hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Open playback settings"
          aria-expanded={showSettings}
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {!isPlaying && (
        <button
          onClick={togglePlayback}
          className="absolute z-10 flex h-18 w-18 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white shadow-2xl backdrop-blur-md transition hover:scale-105 hover:bg-primary focus:outline-none focus:ring-2 focus:ring-white sm:h-20 sm:w-20"
          aria-label="Play"
        >
          <Play className="ml-1 h-8 w-8 fill-current" />
        </button>
      )}

      {showSettings && (
        <section className="absolute right-4 top-20 z-20 w-72 rounded-2xl border border-white/15 bg-zinc-950/95 p-3 text-sm shadow-2xl backdrop-blur-xl sm:right-6 sm:top-24" aria-label="Playback settings">
          <div className="flex items-center justify-between border-b border-white/10 px-2 pb-3">
            <span className="font-semibold">Playback settings</span>
            <Settings className="h-4 w-4 text-white/60" />
          </div>
          <label className="flex cursor-pointer items-center justify-between px-2 py-4">
            <span>
              <span className="block font-medium">Live transcode</span>
              <span className="mt-0.5 block text-xs text-white/55">Improve playback compatibility</span>
            </span>
            <input type="checkbox" checked={transcode} onChange={(event) => setTranscode(event.target.checked)} className="h-4 w-4 accent-primary" />
          </label>
          <div className="border-t border-white/10 px-2 pt-3">
            <span className="mb-2 flex items-center gap-2 text-white/70"><Gauge className="h-4 w-4" /> Playback speed</span>
            <div className="grid grid-cols-4 gap-1">
              {[0.75, 1, 1.25, 1.5].map((rate) => (
                <button key={rate} onClick={() => { const video = videoRef.current; if (video) video.playbackRate = rate; setPlaybackRate(rate); }} className={`rounded-lg px-2 py-2 text-xs font-medium transition ${playbackRate === rate ? "bg-primary text-white" : "bg-white/8 text-white/70 hover:bg-white/15"}`}>
                  {rate}×
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 border-t border-white/10 px-2 pt-3">
            <span className="mb-2 flex items-center gap-2 text-white/70"><Captions className="h-4 w-4" /> Subtitles</span>
            {movie?.subtitles?.length ? (
              <div className="space-y-1">
                <button onClick={() => selectSubtitle(null)} className={`w-full rounded-lg px-2 py-2 text-left text-xs font-medium transition ${activeSubtitleId === null ? "bg-primary text-white" : "bg-white/8 text-white/70 hover:bg-white/15"}`}>Off</button>
                {movie.subtitles.map((subtitle) => (
                  <button key={subtitle.id} onClick={() => selectSubtitle(subtitle.id)} className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition ${activeSubtitleId === subtitle.id ? "bg-primary text-white" : "bg-white/8 text-white/70 hover:bg-white/15"}`}>
                    <span className="truncate">{subtitle.label}</span>
                    <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">{subtitle.language}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/45">No subtitles attached to this title.</p>
            )}
          </div>
        </section>
      )}

      <section className={`absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6 transition-all duration-300 ${showControls ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}`} aria-label="Video controls">
        <div className="mx-auto max-w-7xl">
          <div className="group/progress relative mb-4 h-1.5 cursor-pointer rounded-full bg-white/25 transition hover:h-2.5">
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/25" style={{ width: `${Math.min(bufferProgress, 100)}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${Math.min(progress, 100)}%` }} />
            <input type="range" min="0" max={duration || 0} step="0.1" value={currentTime} onChange={(event) => { const video = videoRef.current; if (video) video.currentTime = Number(event.target.value); }} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Seek" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <ControlButton onClick={togglePlayback} label={isPlaying ? "Pause" : "Play"}>{isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}</ControlButton>
              <ControlButton onClick={() => seekBy(-SKIP_SECONDS)} label="Rewind 10 seconds"><RotateCcw className="h-5 w-5" /></ControlButton>
              <ControlButton onClick={() => seekBy(SKIP_SECONDS)} label="Forward 10 seconds"><RotateCw className="h-5 w-5" /></ControlButton>
              <div className="ml-1 flex items-center gap-2">
                <ControlButton onClick={() => { const video = videoRef.current; if (video) video.muted = !video.muted; }} label={isMuted ? "Unmute" : "Mute"}>{isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</ControlButton>
                <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={(event) => { const video = videoRef.current; if (!video) return; video.volume = Number(event.target.value); video.muted = Number(event.target.value) === 0; }} className="hidden h-1 w-20 accent-primary sm:block" aria-label="Volume" />
              </div>
              <span className="ml-1 whitespace-nowrap text-xs font-medium tabular-nums text-white/85 sm:text-sm">{formatTime(currentTime)} <span className="text-white/45">/ {formatTime(duration)}</span></span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => setShowSettings((open) => !open)} className="hidden items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-white/85 transition hover:bg-white/15 sm:flex" aria-label="Change playback speed">{playbackRate}× <ChevronDown className="h-3 w-3" /></button>
              <ControlButton onClick={() => void togglePictureInPicture()} label="Picture in picture"><PictureInPicture2 className="h-5 w-5" /></ControlButton>
              <ControlButton onClick={() => void toggleFullscreen()} label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>{isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}</ControlButton>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ControlButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white" aria-label={label}>{children}</button>;
}

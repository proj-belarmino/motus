import React, { useState } from "react";
import { Image as ImageIcon, Play, Star } from "lucide-react";
import { useApi } from "../context/ApiContext";
import { Movie } from "../types";

export const MovieCard: React.FC<{ movie: Movie; onClick: () => void }> = ({ movie, onClick }) => {
  const api = useApi();
  const [imgError, setImgError] = useState(false);
  const coverUrl = movie.cover_path && !imgError ? api.getThumbnailUrl(movie.cover_path) : null;
  const year = movie.release_date ? movie.release_date.split("-")[0] : "New";
  return <button onClick={onClick} className="group relative aspect-[2/3] overflow-hidden rounded-xl border border-border bg-surface text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
    {coverUrl ? <img src={coverUrl} alt={movie.title} onError={() => setImgError(true)} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full flex-col items-center justify-center bg-surface-hover text-muted"><ImageIcon className="h-9 w-9 opacity-40" /><span className="mt-2 text-xs">No artwork</span></div>}
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-90" />
    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25"><span className="flex h-11 w-11 scale-90 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-xl transition group-hover:scale-100 group-hover:opacity-100"><Play className="ml-0.5 h-5 w-5 fill-current" /></span></div>
    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4"><h3 className="truncate text-sm font-bold text-white sm:text-base">{movie.title}</h3><div className="mt-1.5 flex items-center justify-between text-xs text-white/70"><span>{year} · {movie.metadata?.resolution || "HD"}</span>{movie.rating ? <span className="flex items-center gap-1 font-medium text-amber-300"><Star className="h-3 w-3 fill-current" /> {movie.rating}</span> : null}</div></div>
  </button>;
};

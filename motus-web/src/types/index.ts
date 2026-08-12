export interface MediaMetadata {
  videoCodec?: string;
  audioCodec?: string;
  resolution?: string;
  bitrate: number;
  fileSize: number;
  durationSeconds: number;
}

export interface Subtitle {
  id: string;
  language: string;
  label: string;
  file_path: string;
}

export interface Movie {
  id: string;
  title: string;
  original_title?: string;
  file_path: string;
  release_date?: string;
  director?: string;
  genres: string[];
  rating: number;
  cover_path?: string;
  file_hash?: string;
  metadata: MediaMetadata;
  subtitles?: Subtitle[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface SearchQuery {
  title?: string;
  query?: string;
  genre?: string;
  year?: number;
  director?: string;
  minRating?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  page?: number;
  size?: number;
}

export interface Episode {
  id: string;
  show_id: string;
  season_number: number;
  episode_number: number;
  title?: string;
  overview?: string;
  release_date?: string;
  file_path: string;
  file_hash?: string;
  cover_path?: string;
  metadata: MediaMetadata;
}

export interface Show {
  id: string;
  title: string;
  original_title?: string;
  overview?: string;
  release_date?: string;
  genres: string[];
  rating: number;
  cover_path?: string;
  status?: string;
  number_of_seasons: number;
  tmdb_id?: number;
  episodes: Episode[];
}

export interface ShowSearchResult {
  tmdbId: number;
  title: string;
  year?: string;
  overview?: string;
  posterUrl?: string;
  rating: number;
  genres: string[];
}

export interface ApiError extends Error {
  response?: {
    status?: number;
    data?: { message?: string };
  };
}

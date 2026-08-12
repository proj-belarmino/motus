export interface MediaMetadata {
  videoCodec?: string;
  audioCodec?: string;
  resolution?: string;
  bitrate: number;
  fileSize: number;
  durationSeconds: number;
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

export interface ApiError extends Error {
  response?: {
    status?: number;
    data?: { message?: string };
  };
}

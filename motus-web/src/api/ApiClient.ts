import { Episode, Movie, NextUpItem, Page, SearchQuery, Show, ShowSearchResult } from "../types";
import { User } from "../services/TokenService";

export interface ApiClient {
  login(
    credentials: Record<string, string>,
  ): Promise<{ token: string; user: User }>;
  logout(): Promise<void>;
  register(data: Record<string, string>): Promise<void>;
  getMovies(query: SearchQuery): Promise<Page<Movie>>;
  getMovie(id: string): Promise<Movie>;
  deleteMovie(id: string): Promise<void>;
  triggerScan(): Promise<void>;
  getThumbnailUrl(coverPath: string): string;
  getStreamUrl(movieId: string, transcode?: boolean): string;
  updateMovieTitle(id: string, title: string): Promise<Movie>;
  refreshMovie(id: string): Promise<Movie>;
  uploadMovie(
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<void>;
  uploadSubtitle(
    movieId: string,
    file: File,
    language?: string,
  ): Promise<Movie>;
  deleteSubtitle(movieId: string, subtitleId: string): Promise<Movie>;
  getSubtitleUrl(movieId: string, subtitleId: string): string;
  updateProfile(data: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ token: string; user: User }>;
  uploadAvatar(file: File): Promise<{ token: string; user: User }>;
  getActivity(): Promise<Array<{ date: string; count: number }>>;
  recordActivity(movieId: string): Promise<void>;
  getRecentMovies(): Promise<Movie[]>;
  getNextUp(limit?: number): Promise<NextUpItem[]>;
  getAvatarUrl(path: string): string;
  toggleFavorite(movieId: string): Promise<boolean>;
  getFavorites(): Promise<Movie[]>;
  isFavorite(movieId: string): Promise<boolean>;
  toggleWatchlist(movieId: string): Promise<boolean>;
  getWatchlist(): Promise<Movie[]>;
  isInWatchlist(movieId: string): Promise<boolean>;
  searchShows(query: string): Promise<ShowSearchResult[]>;
  createShow(title: string, tmdbId?: number): Promise<Show>;
  getShows(): Promise<Show[]>;
  getShow(id: string): Promise<Show>;
  getEpisode(id: string): Promise<Episode>;
  deleteShow(id: string): Promise<void>;
  uploadEpisode(
    showId: string,
    file: File,
    season?: number,
    episode?: number,
  ): Promise<Show>;
  deleteEpisode(showId: string, episodeId: string): Promise<Show>;
  getEpisodeStreamUrl(episodeId: string): string;
}

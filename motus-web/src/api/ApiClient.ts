import { Movie, Page, SearchQuery } from "../types";
import { User } from "../services/TokenService";

export interface ApiClient {
  login(credentials: Record<string, string>): Promise<{ token: string; user: User }>;
  register(data: Record<string, string>): Promise<void>;
  getMovies(query: SearchQuery): Promise<Page<Movie>>;
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
  getAvatarUrl(path: string): string;
}

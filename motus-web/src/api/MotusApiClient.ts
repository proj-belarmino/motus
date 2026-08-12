import { axiosInstance, API_BASE_URL } from "./axiosInstance";
import { ApiClient } from "./ApiClient";
import { Movie, Page, SearchQuery, Show, ShowSearchResult } from "../types";
import { TokenService } from "../services/TokenService";

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string; role: string };
}

export class MotusApiClient implements ApiClient {
  async login(credentials: Record<string, string>): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>(
      "/api/auth/login",
      credentials,
    );
    return response.data;
  }

  async register(data: Record<string, string>): Promise<void> {
    await axiosInstance.post("/api/auth/register", data);
  }

  async updateProfile(data: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<AuthResponse> {
    const response = await axiosInstance.put<AuthResponse>(
      "/api/user/profile",
      data,
    );
    return response.data;
  }

  async uploadAvatar(file: File): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosInstance.post<AuthResponse>(
      "/api/user/avatar",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  }

  async getActivity(): Promise<Array<{ date: string; count: number }>> {
    return (await axiosInstance.get("/api/user/activity")).data;
  }
  async recordActivity(movieId: string): Promise<void> {
    await axiosInstance.post("/api/user/activity", { movieId });
  }
  async getRecentMovies(): Promise<Movie[]> {
    return (await axiosInstance.get<Movie[]>("/api/user/recent")).data;
  }
  getAvatarUrl(path: string): string {
    return `${API_BASE_URL}/api/avatars/${encodeURIComponent(path)}`;
  }

  async toggleFavorite(movieId: string): Promise<boolean> {
    return (
      await axiosInstance.post<{ favorited: boolean }>(
        "/api/user/favorites/toggle",
        { movieId },
      )
    ).data.favorited;
  }
  async getFavorites(): Promise<Movie[]> {
    return (await axiosInstance.get<Movie[]>("/api/user/favorites")).data;
  }
  async isFavorite(movieId: string): Promise<boolean> {
    return (
      await axiosInstance.get<{ favorited: boolean }>(
        "/api/user/favorites/is-favorite",
        { params: { movieId } },
      )
    ).data.favorited;
  }
  async toggleWatchlist(movieId: string): Promise<boolean> {
    return (
      await axiosInstance.post<{ inWatchlist: boolean }>(
        "/api/user/watchlist/toggle",
        { movieId },
      )
    ).data.inWatchlist;
  }
  async getWatchlist(): Promise<Movie[]> {
    return (await axiosInstance.get<Movie[]>("/api/user/watchlist")).data;
  }
  async isInWatchlist(movieId: string): Promise<boolean> {
    return (
      await axiosInstance.get<{ inWatchlist: boolean }>(
        "/api/user/watchlist/is-on-watchlist",
        { params: { movieId } },
      )
    ).data.inWatchlist;
  }

  async searchShows(query: string): Promise<ShowSearchResult[]> {
    return (
      await axiosInstance.get<ShowSearchResult[]>("/api/shows/search", {
        params: { q: query },
      })
    ).data;
  }
  async createShow(title: string, tmdbId?: number): Promise<Show> {
    return (await axiosInstance.post<Show>("/api/shows", { title, tmdbId }))
      .data;
  }
  async getShows(): Promise<Show[]> {
    return (await axiosInstance.get<Show[]>("/api/shows")).data;
  }
  async getShow(id: string): Promise<Show> {
    return (await axiosInstance.get<Show>(`/api/shows/${id}`)).data;
  }
  async deleteShow(id: string): Promise<void> {
    await axiosInstance.delete(`/api/shows/${id}`);
  }
  async uploadEpisode(
    showId: string,
    file: File,
    season?: number,
    episode?: number,
  ): Promise<Show> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosInstance.post<Show>(
      `/api/shows/${showId}/episodes`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        params: { season, episode },
      },
    );
    return response.data;
  }
  async deleteEpisode(showId: string, episodeId: string): Promise<Show> {
    return (
      await axiosInstance.delete<Show>(
        `/api/shows/${showId}/episodes/${episodeId}`,
      )
    ).data;
  }
  getEpisodeStreamUrl(episodeId: string): string {
    const token = TokenService.getToken();
    const url = new URL(`${API_BASE_URL}/api/stream/episode/${episodeId}`);
    if (token) {
      url.searchParams.append("token", token);
    }
    return url.toString();
  }

  async getMovies(query: SearchQuery): Promise<Page<Movie>> {
    const response = await axiosInstance.get<Page<Movie>>("/api/movies", {
      params: query,
    });
    return response.data;
  }

  async getMovie(id: string): Promise<Movie> {
    const response = await axiosInstance.get<Movie>(`/api/movies/${id}`);
    return response.data;
  }

  async deleteMovie(id: string): Promise<void> {
    await axiosInstance.delete(`/api/movies/${id}`);
  }

  async triggerScan(): Promise<void> {
    await axiosInstance.post("/api/movies/scan");
  }

  async updateMovieTitle(id: string, title: string): Promise<Movie> {
    const response = await axiosInstance.put<Movie>(`/api/movies/${id}/title`, {
      title,
    });
    return response.data;
  }

  async refreshMovie(id: string): Promise<Movie> {
    const response = await axiosInstance.post<Movie>(
      `/api/movies/${id}/refresh`,
    );
    return response.data;
  }

  async uploadSubtitle(
    movieId: string,
    file: File,
    language?: string,
  ): Promise<Movie> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosInstance.post<Movie>(
      `/api/movies/${movieId}/subtitles`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        params: language ? { language } : undefined,
      },
    );
    return response.data;
  }

  async deleteSubtitle(movieId: string, subtitleId: string): Promise<Movie> {
    const response = await axiosInstance.delete<Movie>(
      `/api/movies/${movieId}/subtitles/${subtitleId}`,
    );
    return response.data;
  }

  getSubtitleUrl(movieId: string, subtitleId: string): string {
    const token = TokenService.getToken();
    const url = new URL(
      `${API_BASE_URL}/api/movies/${movieId}/subtitles/${subtitleId}/file`,
    );
    if (token) {
      url.searchParams.append("token", token);
    }
    return url.toString();
  }

  async uploadMovie(
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);

    await axiosInstance.post("/api/movies/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percentCompleted);
        }
      },
    });
  }

  getThumbnailUrl(coverPath: string): string {
    if (!coverPath) return "";
    if (coverPath.startsWith("http://") || coverPath.startsWith("https://")) {
      return coverPath;
    }
    const filename = coverPath.split(/[/\\]/).pop();
    return `${API_BASE_URL}/api/thumbnails/${filename}`;
  }

  getStreamUrl(movieId: string, transcode: boolean = false): string {
    const token = TokenService.getToken();
    const url = new URL(`${API_BASE_URL}/api/stream/movie/${movieId}`);

    if (token) {
      url.searchParams.append("token", token);
    }
    if (transcode) {
      url.searchParams.append("transcode", "true");
    }
    return url.toString();
  }
}

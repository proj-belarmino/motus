package br.ufpb.motus.services.show;

import br.ufpb.motus.model.movie.TmdbGenre;
import br.ufpb.motus.model.movie.TmdbGenreListResponse;
import br.ufpb.motus.model.show.ShowSearchResult;
import br.ufpb.motus.model.show.TmdbTvDetails;
import br.ufpb.motus.model.show.TmdbTvResult;
import br.ufpb.motus.model.show.TmdbTvSearchResponse;
import br.ufpb.motus.services.log.Logger;
import br.ufpb.motus.services.network.NetworkClient;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * provides metadata enrichment for shows and episodes by talking to the TMDB external api.
 */
@Service
public class ShowMetadataService {

    private static final String BASE_URL = "https://api.themoviedb.org/3";
    private static final String POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

    private final NetworkClient networkClient;
    private final String apiKey;

    private volatile Map<Integer, String> tvGenreCache;

    public ShowMetadataService(
            NetworkClient networkClient,
            @Value("${tmdb.api.key}") String apiKey) {
        this.networkClient = networkClient;
        this.apiKey = apiKey;
    }

    public @NonNull List<ShowSearchResult> searchShows(@NonNull String query) {
        if (query.isBlank()) return List.of();
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            TmdbTvSearchResponse response = getWithAuth(BASE_URL + "/search/tv?query=" + encodedQuery, TmdbTvSearchResponse.class);
            if (response == null || response.results() == null) return List.of();
            return response.results().stream()
                    .map(this::toSearchResult)
                    .filter(Objects::nonNull)
                    .limit(12)
                    .toList();
        } catch (Exception error) {
            Logger.warn("TMDB show search failed for '%s': %s", query, error.getMessage());
            return List.of();
        }
    }

    public @NonNull TmdbTvDetails fetchTvDetails(int tmdbId) {
        return getWithAuth(BASE_URL + "/tv/" + tmdbId, TmdbTvDetails.class);
    }

    public @NonNull String resolvePosterUrl(String posterPath) {
        return posterPath != null && !posterPath.isBlank() ? POSTER_BASE_URL + posterPath : null;
    }

    private @NonNull ShowSearchResult toSearchResult(@NonNull TmdbTvResult result) {
        List<String> genres = resolveGenres(result.genreIds());
        return new ShowSearchResult(
                result.id(),
                result.name() != null ? result.name() : "Untitled",
                extractYear(result.firstAirDate()),
                result.overview(),
                resolvePosterUrl(result.posterPath()),
                result.voteAverage(),
                genres
        );
    }

    private String extractYear(String date) {
        if (date == null || date.isBlank()) return null;
        String[] parts = date.split("-");
        return parts.length > 0 ? parts[0] : null;
    }

    private <T> T getWithAuth(String url, Class<T> responseType) {
        Map<String, String> headers = new HashMap<>(Map.of("Accept", "application/json"));
        if (apiKey.length() < 50) {
            url += (url.contains("?") ? "&" : "?") + "api_key=" + apiKey;
        } else {
            headers.put("Authorization", "Bearer " + apiKey);
        }
        return networkClient.get(url, responseType, headers);
    }

    private @NonNull List<String> resolveGenres(List<Integer> genreIds) {
        if (genreIds == null) return List.of();
        try {
            Map<Integer, String> genreMap = getGenreMap();
            return genreIds.stream().map(genreMap::get).filter(Objects::nonNull).toList();
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private @NonNull Map<Integer, String> getGenreMap() {
        Map<Integer, String> cache = tvGenreCache;
        if (cache == null) {
            synchronized (this) {
                cache = tvGenreCache;
                if (cache == null) {
                    tvGenreCache = cache = fetchGenreMap();
                }
            }
        }
        return cache;
    }

    private @NonNull Map<Integer, String> fetchGenreMap() {
        TmdbGenreListResponse response = getWithAuth(BASE_URL + "/genre/tv/list", TmdbGenreListResponse.class);
        if (response.genres() == null) return Map.of();
        return response.genres().stream()
                .collect(Collectors.toUnmodifiableMap(TmdbGenre::id, TmdbGenre::name));
    }
}
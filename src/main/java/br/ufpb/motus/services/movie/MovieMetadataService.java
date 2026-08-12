package br.ufpb.motus.services.movie;

import br.ufpb.motus.model.movie.ExternalMovieInfo;
import br.ufpb.motus.model.movie.MovieEntity;
import br.ufpb.motus.model.movie.TmdbCreditsResponse;
import br.ufpb.motus.model.movie.TmdbCrewMember;
import br.ufpb.motus.model.movie.TmdbGenre;
import br.ufpb.motus.model.movie.TmdbGenreListResponse;
import br.ufpb.motus.model.movie.TmdbMovieResult;
import br.ufpb.motus.model.movie.TmdbSearchResponse;
import br.ufpb.motus.services.fs.FileManager;
import br.ufpb.motus.services.log.Logger;
import br.ufpb.motus.services.network.NetworkClient;
import org.jetbrains.annotations.Contract;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * provides metadata enrichment for media files by communicating with the TMDB external api.
 */
@Service
public class MovieMetadataService {

    private static final String BASE_URL = "https://api.themoviedb.org/3";
    private static final String POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

    private final NetworkClient networkClient;
    private final String apiKey;

    private volatile Map<Integer, String> genreCache;

    public MovieMetadataService(
            NetworkClient networkClient,
            @Value("${tmdb.api.key}") String apiKey) {
        this.networkClient = networkClient;
        this.apiKey = apiKey;
    }

    public @NonNull Optional<ExternalMovieInfo> fetchByTitle(@NonNull String title) {
        if (title.isBlank()) return Optional.empty();

        try {
            TmdbSearchResponse response = search(title);
            if (response != null && response.results() != null && !response.results().isEmpty()) {
                return Optional.of(toExternalMovieInfo(response.results().getFirst()));
            }

            String[] words = title.split("\\s+");
            if (words.length > 3) {
                String fallbackTitle = String.join(" ", java.util.Arrays.copyOfRange(words, 0, 3));
                TmdbSearchResponse fallbackResponse = search(fallbackTitle);
                if (fallbackResponse != null && fallbackResponse.results() != null && !fallbackResponse.results().isEmpty()) {
                    return Optional.of(toExternalMovieInfo(fallbackResponse.results().getFirst()));
                }
            }

            if (words.length > 1) {
                TmdbSearchResponse extremeFallback = search(words[0]);
                if (extremeFallback != null && extremeFallback.results() != null && !extremeFallback.results().isEmpty()) {
                    return Optional.of(toExternalMovieInfo(extremeFallback.results().getFirst()));
                }
            }
        } catch (Exception error) {
            Logger.warn("TMDB metadata fetch failed for '%s': %s", title, error.getMessage());
        }

        return Optional.empty();
    }

    @Contract("_, _ -> new")
    public @NonNull MovieEntity toEntity(@NonNull Path filePath, @NonNull ExternalMovieInfo info) {
        return new MovieEntity(
                UUID.randomUUID().toString(),
                info.title(),
                info.originalTitle(),
                filePath.toAbsolutePath().toString(),
                info.releaseDate(),
                info.director(),
                info.genres(),
                info.rating(),
                info.coverUrl(),
                FileManager.calculateSha256(filePath),
                null,
                List.of()
        );
    }

    private @NonNull TmdbSearchResponse search(@NonNull String title) {
        String encodedTitle = URLEncoder.encode(title, StandardCharsets.UTF_8);
        String url = BASE_URL + "/search/movie?query=" + encodedTitle;

        // Intelligently handle both v3 hex keys and v4 JWT tokens
        if (apiKey.length() < 50) {
            url += "&api_key=" + apiKey;
            return networkClient.get(url, TmdbSearchResponse.class, Map.of("Accept", "application/json"));
        } else {
            return networkClient.get(url, TmdbSearchResponse.class, Map.of(
                    "Authorization", "Bearer " + apiKey,
                    "Accept", "application/json"
            ));
        }
    }

    @Contract("_ -> new")
    private @NonNull ExternalMovieInfo toExternalMovieInfo(@NonNull TmdbMovieResult result) {
        List<String> genres = resolveGenres(result.genreIds());
        String coverUrl = result.posterPath() != null ? POSTER_BASE_URL + result.posterPath() : null;
        String director = fetchDirector(result.id()).orElse(null);

        return new ExternalMovieInfo(
                result.title(),
                result.originalTitle(),
                director,
                coverUrl,
                result.overview(),
                result.releaseDate(),
                genres,
                result.voteAverage()
        );
    }

    private @NonNull Optional<String> fetchDirector(int movieId) {
        String url = BASE_URL + "/movie/" + movieId + "/credits";
        try {
            TmdbCreditsResponse response;
            if (apiKey.length() < 50) {
                response = networkClient.get(url + "?api_key=" + apiKey, TmdbCreditsResponse.class, Map.of("Accept", "application/json"));
            } else {
                response = networkClient.get(url, TmdbCreditsResponse.class, Map.of(
                        "Authorization", "Bearer " + apiKey,
                        "Accept", "application/json"
                ));
            }

            if (response.crew() != null) {
                return response.crew().stream()
                        .filter(member -> "Director".equals(member.job()))
                        .map(TmdbCrewMember::name)
                        .findFirst();
            }
        } catch (Exception ignored) {
        }

        return Optional.empty();
    }

    private @NonNull List<String> resolveGenres(List<Integer> genreIds) {
        if (genreIds == null) return List.of();
        try {
            Map<Integer, String> genreMap = getGenreMap();
            return genreIds.stream()
                    .map(genreMap::get)
                    .filter(java.util.Objects::nonNull)
                    .toList();
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private @NonNull Map<Integer, String> getGenreMap() {
        Map<Integer, String> cache = genreCache;
        if (cache == null) {
            synchronized (this) {
                cache = genreCache;
                if (cache == null) {
                    genreCache = cache = fetchGenreMap();
                }
            }
        }
        return cache;
    }

    private @NonNull Map<Integer, String> fetchGenreMap() {
        String url = BASE_URL + "/genre/movie/list";
        TmdbGenreListResponse response;

        if (apiKey.length() < 50) {
            response = networkClient.get(url + "?api_key=" + apiKey, TmdbGenreListResponse.class, Map.of("Accept", "application/json"));
        } else {
            response = networkClient.get(url, TmdbGenreListResponse.class, Map.of(
                    "Authorization", "Bearer " + apiKey,
                    "Accept", "application/json"
            ));
        }

        if (response.genres() == null) return Map.of();

        return response.genres().stream()
                .collect(Collectors.toUnmodifiableMap(TmdbGenre::id, TmdbGenre::name));
    }
}
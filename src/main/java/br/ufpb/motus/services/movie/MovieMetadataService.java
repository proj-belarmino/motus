package br.ufpb.motus.services.movie;

import br.ufpb.motus.model.movie.ExternalMovieInfo;
import br.ufpb.motus.model.movie.TmdbGenre;
import br.ufpb.motus.model.movie.TmdbGenreListResponse;
import br.ufpb.motus.model.movie.TmdbMovieResult;
import br.ufpb.motus.model.movie.TmdbSearchResponse;
import br.ufpb.motus.services.network.NetworkClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class MovieMetadataService {
    private static final String BASE_URL = "https://api.themoviedb.org/3";
    private static final String POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

    private final String apiKey;
    private Map<Integer, String> genreCache;

    public MovieMetadataService(String apiKey) {
        this.apiKey = apiKey;
    }

    public ExternalMovieInfo fetchByTitle(String title) {
        TmdbSearchResponse response = search(title);
        TmdbMovieResult result = pickBestResult(response);
        return toExternalMovieInfo(result);
    }

    private TmdbSearchResponse search(String title) {
        String encodedTitle = URLEncoder.encode(title, StandardCharsets.UTF_8);
        String url = BASE_URL + "/search/movie?query=" + encodedTitle + "&api_key=" + apiKey;
        return NetworkClient.get(url, TmdbSearchResponse.class, Map.of());
    }

    private TmdbMovieResult pickBestResult(TmdbSearchResponse response) {
        if (response.results().isEmpty()) {
            throw new IllegalStateException("No TMDB results found");
        }
        return response.results().get(0);
    }

    private ExternalMovieInfo toExternalMovieInfo(TmdbMovieResult result) {
        List<String> genres = resolveGenres(result.genreIds());
        String coverUrl = POSTER_BASE_URL + result.posterPath();

        return new ExternalMovieInfo(
                result.title(),
                result.originalTitle(),
                null,
                coverUrl,
                result.overview(),
                result.releaseDate(),
                genres,
                result.voteAverage()
        );
    }

    private List<String> resolveGenres(List<Integer> genreIds) {
        Map<Integer, String> genreMap = getGenreMap();
        return genreIds.stream()
                .map(genreMap::get)
                .collect(Collectors.toList());
    }

    private Map<Integer, String> getGenreMap() {
        if (genreCache == null) {
            genreCache = fetchGenreMap();
        }
        return genreCache;
    }

    private Map<Integer, String> fetchGenreMap() {
        String url = BASE_URL + "/genre/movie/list?api_key=" + apiKey;
        TmdbGenreListResponse response = NetworkClient.get(url, TmdbGenreListResponse.class, Map.of());
        return response.genres().stream()
                .collect(Collectors.toMap(TmdbGenre::id, TmdbGenre::name));
    }
}

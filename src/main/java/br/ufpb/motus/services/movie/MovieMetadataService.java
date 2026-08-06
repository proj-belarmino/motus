package br.ufpb.motus.services.movie;

import br.ufpb.motus.model.movie.ExternalMovieInfo;
import br.ufpb.motus.model.movie.MovieEntity;
import br.ufpb.motus.model.movie.TmdbGenre;
import br.ufpb.motus.model.movie.TmdbGenreListResponse;
import br.ufpb.motus.model.movie.TmdbMovieResult;
import br.ufpb.motus.model.movie.TmdbSearchResponse;
import br.ufpb.motus.services.fs.FileManager;
import br.ufpb.motus.services.network.NetworkClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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

    // metadata (FFprobe) e coverPath (download da imagem) ainda não existem, ficam null por enquanto
    public MovieEntity toEntity(Path filePath, ExternalMovieInfo info) {
        return new MovieEntity(
                UUID.randomUUID().toString(),
                info.title(),
                info.originalTitle(),
                filePath.toString(),
                info.releaseDate(),
                info.director(),
                info.genres(),
                info.rating(),
                null,
                FileManager.SHA256(filePath),
                null
        );
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

package br.ufpb.motus.services.movie;

import br.ufpb.motus.model.movie.TmdbSearchResponse;
import br.ufpb.motus.services.network.NetworkClient;

import java.util.Map;

public class TmdbDemo {
    public static void main(String[] args) {
        String apiKey = System.getenv("TMDB_API_KEY");
        String url = "https://api.themoviedb.org/3/search/movie?query=Inception&api_key=" + apiKey;

        TmdbSearchResponse response = NetworkClient.get(url, TmdbSearchResponse.class, Map.of());

        System.out.println(response);
    }
}

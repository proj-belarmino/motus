package br.ufpb.motus.model.show;

import br.ufpb.motus.model.movie.TmdbGenre;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record TmdbTvDetails(
        @JsonProperty("id") int id,
        @JsonProperty("name") String name,
        @JsonProperty("original_name") String originalName,
        @JsonProperty("overview") String overview,
        @JsonProperty("first_air_date") String firstAirDate,
        @JsonProperty("genres") List<TmdbGenre> genres,
        @JsonProperty("poster_path") String posterPath,
        @JsonProperty("backdrop_path") String backdropPath,
        @JsonProperty("vote_average") double voteAverage,
        @JsonProperty("number_of_seasons") int numberOfSeasons,
        @JsonProperty("status") String status
) {}
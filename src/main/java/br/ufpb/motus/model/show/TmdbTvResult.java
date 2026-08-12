package br.ufpb.motus.model.show;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record TmdbTvResult(
        @JsonProperty("id") int id,
        @JsonProperty("name") String name,
        @JsonProperty("original_name") String originalName,
        @JsonProperty("first_air_date") String firstAirDate,
        @JsonProperty("overview") String overview,
        @JsonProperty("genre_ids") List<Integer> genreIds,
        @JsonProperty("poster_path") String posterPath,
        @JsonProperty("backdrop_path") String backdropPath,
        @JsonProperty("vote_average") double voteAverage
) {}
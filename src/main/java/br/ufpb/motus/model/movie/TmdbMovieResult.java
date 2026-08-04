package br.ufpb.motus.model.movie;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;
import java.util.List;

public record TmdbMovieResult(
        @JsonProperty("id") int id,
        @JsonProperty("title") String title,
        @JsonProperty("original_title") String originalTitle,
        @JsonProperty("original_language") String originalLanguage,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        @JsonProperty("release_date") LocalDate releaseDate,

        @JsonProperty("overview") String overview,
        @JsonProperty("genre_ids") List<Integer> genreIds,
        @JsonProperty("poster_path") String posterPath,
        @JsonProperty("backdrop_path") String backdropPath,
        @JsonProperty("popularity") double popularity,
        @JsonProperty("vote_average") double voteAverage,
        @JsonProperty("vote_count") int voteCount,
        @JsonProperty("adult") boolean adult,
        @JsonProperty("video") boolean video
) {}

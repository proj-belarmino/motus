package br.ufpb.motus.model.movie;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record TmdbSearchResponse(
        @JsonProperty("page") int page,
        @JsonProperty("results") List<TmdbMovieResult> results,
        @JsonProperty("total_pages") int totalPages,
        @JsonProperty("total_results") int totalResults
) {}

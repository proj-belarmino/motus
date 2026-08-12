package br.ufpb.motus.model.show;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record TmdbTvSearchResponse(
        @JsonProperty("page") int page,
        @JsonProperty("results") List<TmdbTvResult> results,
        @JsonProperty("total_pages") int totalPages,
        @JsonProperty("total_results") int totalResults
) {}
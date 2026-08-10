package br.ufpb.motus.model.movie;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record TmdbGenreListResponse(
        @JsonProperty("genres") List<TmdbGenre> genres
) {}

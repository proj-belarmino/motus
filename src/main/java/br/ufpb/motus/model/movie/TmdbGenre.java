package br.ufpb.motus.model.movie;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TmdbGenre(
        @JsonProperty("id") int id,
        @JsonProperty("name") String name
) {}

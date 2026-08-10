package br.ufpb.motus.model.movie;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TmdbCrewMember(
        @JsonProperty("name") String name,
        @JsonProperty("job") String job
) {}

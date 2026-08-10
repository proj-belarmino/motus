package br.ufpb.motus.model.movie;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record TmdbCreditsResponse(
        @JsonProperty("crew") List<TmdbCrewMember> crew
) {}

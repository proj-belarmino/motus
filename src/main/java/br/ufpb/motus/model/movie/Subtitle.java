package br.ufpb.motus.model.movie;

import com.fasterxml.jackson.annotation.JsonProperty;

public record Subtitle(
        @JsonProperty("id") String id,
        @JsonProperty("language") String language,
        @JsonProperty("label") String label,
        @JsonProperty("file_path") String filePath
) {}

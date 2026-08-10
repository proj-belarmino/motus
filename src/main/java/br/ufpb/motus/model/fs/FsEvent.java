package br.ufpb.motus.model.fs;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.jspecify.annotations.NonNull;

/**
 * Represents a file system event broadcasted by the external Rust observer.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record FsEvent(
        @JsonProperty("type") @NonNull EventType type,
        @JsonProperty("path") @NonNull String path,
        @JsonProperty("old_path") String oldPath
) {
    public enum EventType {
        CREATED,
        MODIFIED,
        DELETED,
        RENAMED
    }
}
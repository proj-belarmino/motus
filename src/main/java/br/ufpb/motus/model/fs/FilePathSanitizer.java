package br.ufpb.motus.model.fs;

import org.jspecify.annotations.Nullable;

import java.nio.file.Path;

/**
 * Converts stored absolute filesystem paths into safe, display-only values for
 * API responses, so the server directory layout is never leaked to clients.
 */
public final class FilePathSanitizer {

    private FilePathSanitizer() {}

    /**
     * Reduces a stored path to a relative, display-only value.
     * <ul>
     *   <li>{@code null}/{@code blank} input is returned unchanged.</li>
     *   <li>Remote {@code http(s)} URLs (e.g. TMDB posters) are returned unchanged.</li>
     *   <li>Local paths are reduced to their file name.</li>
     * </ul>
     */
    public static @Nullable String toDisplayPath(@Nullable String path) {
        if (path == null || path.isBlank()) {
            return path;
        }

        String trimmed = path.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }

        try {
            String name = Path.of(trimmed).getFileName().toString();
            return name.isBlank() ? trimmed : name;
        } catch (RuntimeException error) {
            return trimmed;
        }
    }
}

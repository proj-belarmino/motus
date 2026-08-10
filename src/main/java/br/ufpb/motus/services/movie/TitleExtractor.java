package br.ufpb.motus.services.movie;

import org.jspecify.annotations.NonNull;
import java.util.regex.Pattern;

public final class TitleExtractor {
    private static final Pattern EXTENSION_PATTERN = Pattern.compile("[.][^.]+$");
    private static final Pattern SEPARATOR_PATTERN = Pattern.compile("[._-]");
    private static final Pattern TAGS_PATTERN = Pattern.compile("(?i)(1080p|720p|2160p|4k|bluray|web-dl|webrip|hdrip|x264|x265|hevc|remux).*$");
    private static final Pattern YEAR_PATTERN = Pattern.compile(" (19\\d{2}|20\\d{2})\\s*$");
    private static final Pattern MULTIPLE_SPACES_PATTERN = Pattern.compile("\\s+");

    private TitleExtractor() {}

    /**
     * Cleans up common scene release filename patterns to extract a usable movie title.
     * Removes file extensions, resolution tags, source tags, and trailing years.
     */
    public static @NonNull String extractTitle(String filename) {
        if (filename == null || filename.isBlank()) {
            return "";
        }

        String name = EXTENSION_PATTERN.matcher(filename).replaceFirst("");
        name = SEPARATOR_PATTERN.matcher(name).replaceAll(" ");
        name = TAGS_PATTERN.matcher(name).replaceAll("");
        name = YEAR_PATTERN.matcher(name).replaceAll("");
        name = MULTIPLE_SPACES_PATTERN.matcher(name).replaceAll(" ");

        return name.trim();
    }
}
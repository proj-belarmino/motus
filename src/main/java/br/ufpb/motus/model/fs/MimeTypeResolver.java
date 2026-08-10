package br.ufpb.motus.model.fs;

import org.jetbrains.annotations.Contract;
import org.jspecify.annotations.NonNull;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public final class MimeTypeResolver {
    private MimeTypeResolver() {}

    @Contract(pure = true)
    public static @NonNull String resolve(@NonNull Path path) {
        String filename = path.getFileName().toString().toLowerCase();

        if (filename.endsWith(".mp4")) return "video/mp4";
        if (filename.endsWith(".webm")) return "video/webm";
        if (filename.endsWith(".mkv")) return "video/x-matroska";
        if (filename.endsWith(".avi")) return "video/x-msvideo";
        if (filename.endsWith(".mp3")) return "audio/mpeg";
        if (filename.endsWith(".flac")) return "audio/flac";
        if (filename.endsWith(".png")) return "image/png";
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";

        try {
            String probed = Files.probeContentType(path);
            return probed != null ? probed : "application/octet-stream";
        } catch (IOException ignored) {
            return "application/octet-stream";
        }
    }
}
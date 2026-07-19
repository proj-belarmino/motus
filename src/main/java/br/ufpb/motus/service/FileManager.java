package br.ufpb.motus.service;

import org.jspecify.annotations.NonNull;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Stream;

public final class FileManager {
    // Guarantee of no instantiation
    private FileManager() {}

    // OS-agnostic path resolution
    public static @NonNull Path resolve(String first, String... more) {
        return Paths.get(first, more);
    }

    // Verify if path or directory exists.
    public static boolean exists(Path path) {
        return Files.exists(path);
    }

    // Delete a file or empty directory if it exists.
    public static boolean delete(Path path) {
        try {
            return Files.deleteIfExists(path);
        } catch (IOException error) {
            throw new UncheckedIOException(error);
        }
    }

    // Execute functional operation on a stream of lines.
    public static <Type> Type withLines(Path path, @NonNull Function<Stream<String>, Type> action) {
        try (Stream<String> lines = Files.lines(path, StandardCharsets.UTF_8)) {
            return action.apply(lines);
        } catch (IOException error) {
            throw new UncheckedIOException(error);
        }
    }

    // Read entire content and map to another type.
    public static <Type> Type mapContent(Path path, @NonNull Function<String, Type> mapper) {
        try {
            String content = Files.readString(path, StandardCharsets.UTF_8);
            return mapper.apply(content);
        } catch (IOException error) {
            throw new UncheckedIOException(error);
        }
    }

    // Perform an action on the bytes of the file.
    public static void withBytes(Path path, @NonNull Consumer<byte[]> action) {
        try {
            byte[] bytes = Files.readAllBytes(path);
            action.accept(bytes);
        } catch (IOException error) {
            throw new UncheckedIOException(error);
        }
    }

    //  Write a contiguous string to a file.
    public static void write(Path path, String content) {
        try {
            ensureParents(path);
            Files.writeString(path, content, StandardCharsets.UTF_8);
        } catch (IOException error) {
            throw new UncheckedIOException(error);
        }
    }

    // Write a list of lines to a file.
    public static void write(Path path, List<String> lines) {
        try {
            ensureParents(path);
            Files.write(path, lines, StandardCharsets.UTF_8);
        } catch (IOException error) {
            throw new UncheckedIOException(error);
        }
    }

    // Compute the SHA256 hash of a file.
    public static String SHA256(Path path) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] fileBytes = Files.readAllBytes(path);
            byte[] hashBytes = digest.digest(fileBytes);
            return HexFormat.of().formatHex(hashBytes);
        } catch (IOException error ) {
            throw new UncheckedIOException(error);
        } catch (NoSuchAlgorithmException error) {
            throw new RuntimeException(error);
        }
    }

    private static void ensureParents(Path path) throws IOException {
        Path parent  = path.getParent();
        boolean valid = parent != null && !Files.exists(parent);
        if (valid) {
            Files.createDirectories(parent);
        }
    }
}
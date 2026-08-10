package br.ufpb.motus.services.fs;

import br.ufpb.motus.model.exception.FileOperationException;
import org.jspecify.annotations.NonNull;

import java.io.IOException;
import java.io.InputStream;
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

    private FileManager() {}

    public static @NonNull Path resolve(String first, String... more) {
        return Paths.get(first, more);
    }

    public static boolean exists(Path path) {
        return Files.exists(path);
    }

    public static boolean delete(Path path) {
        try {
            return Files.deleteIfExists(path);
        } catch (IOException error) {
            throw new FileOperationException(path, "delete", error);
        }
    }

    public static <Type> Type withLines(Path path, @NonNull Function<Stream<String>, Type> action) {
        try (Stream<String> lines = Files.lines(path, StandardCharsets.UTF_8)) {
            return action.apply(lines);
        } catch (IOException error) {
            throw new FileOperationException(path, "read lines", error);
        }
    }

    public static <Type> Type mapContent(Path path, @NonNull Function<String, Type> mapper) {
        try {
            String content = Files.readString(path, StandardCharsets.UTF_8);
            return mapper.apply(content);
        } catch (IOException error) {
            throw new FileOperationException(path, "read content", error);
        }
    }

    public static void withBytes(Path path, @NonNull Consumer<byte[]> action) {
        try {
            byte[] bytes = Files.readAllBytes(path);
            action.accept(bytes);
        } catch (IOException error) {
            throw new FileOperationException(path, "read bytes", error);
        }
    }

    public static void write(Path path, String content) {
        try {
            ensureParents(path);
            Files.writeString(path, content, StandardCharsets.UTF_8);
        } catch (IOException error) {
            throw new FileOperationException(path, "write string", error);
        }
    }

    public static void write(Path path, List<String> lines) {
        try {
            ensureParents(path);
            Files.write(path, lines, StandardCharsets.UTF_8);
        } catch (IOException error) {
            throw new FileOperationException(path, "write lines", error);
        }
    }

    /**
     * computes sha-256 hash using a buffered stream.
     * avoids reading the entire file into memory (which causes out-of-memory errors on large videos).
     */
    public static String calculateSha256(Path path) {
        try (InputStream is = Files.newInputStream(path)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int read;

            while ((read = is.read(buffer)) > 0) {
                digest.update(buffer, 0, read);
            }

            return HexFormat.of().formatHex(digest.digest());
        } catch (IOException error) {
            throw new FileOperationException(path, "calculate sha-256", error);
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("sha-256 algorithm not available in the current jvm", error);
        }
    }

    private static void ensureParents(Path path) throws IOException {
        Path parent = path.getParent();
        if (parent != null && !Files.exists(parent)) {
            Files.createDirectories(parent);
        }
    }
}
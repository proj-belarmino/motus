package br.ufpb.motus.services.streaming;

import br.ufpb.motus.model.fs.MimeTypeResolver;
import br.ufpb.motus.model.network.MediaRange;
import br.ufpb.motus.model.network.MediaStreamResult;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.channels.Channels;
import java.nio.channels.FileChannel;
import java.nio.channels.WritableByteChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Optional;

/**
 * translates HTTP range requirements into optimal zero-copy file channel transfers.
 */
@Service
public class StreamingService {

    private static final long MAX_CHUNK_SIZE = 10 * 1024 * 1024L; // 10 mb chunks

    /**
     * resolves the physical boundaries of a requested media stream.
     *
     * @param filePath the path to the physical media file
     * @param rangeHeader the raw HTTP range header requested by the client, or null
     * @return a structured stream result handling the required I/O pipeline
     * @throws IOException if file attributes cannot be read
     * @throws IllegalArgumentException if the file is empty
     */
    public @NonNull MediaStreamResult resolveStream(@NonNull Path filePath, @Nullable String rangeHeader) throws IOException {
        long fileSize = Files.size(filePath);
        if (fileSize == 0) {
            throw new IllegalArgumentException("Cannot stream an empty file.");
        }

        String mimeType = MimeTypeResolver.resolve(filePath);

        if (rangeHeader == null || rangeHeader.isBlank()) {
            return new MediaStreamResult(
                    fileSize,
                    mimeType,
                    Optional.empty(),
                    output -> transferFully(filePath, 0, fileSize, output)
            );
        }

        MediaRange range = MediaRange.parse(rangeHeader, fileSize, MAX_CHUNK_SIZE);

        return new MediaStreamResult(
                range.length(),
                mimeType,
                Optional.of(range),
                output -> transferFully(filePath, range.start(), range.length(), output)
        );
    }

    private void transferFully(@NonNull Path filePath, long position, long count, @NonNull OutputStream out) throws IOException {
        try (FileChannel fileChannel = FileChannel.open(filePath, StandardOpenOption.READ);
             WritableByteChannel targetChannel = Channels.newChannel(out)) {

            long remaining = count;
            long currentPosition = position;

            while (remaining > 0) {
                long transferred = fileChannel.transferTo(currentPosition, remaining, targetChannel);

                if (transferred <= 0) {
                    break;
                }

                currentPosition += transferred;
                remaining -= transferred;
            }
        }
    }
}
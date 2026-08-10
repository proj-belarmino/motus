package br.ufpb.motus.model.network;

import br.ufpb.motus.model.exception.InvalidRangeRequestException;
import org.jspecify.annotations.NonNull;

public record MediaRange(long start, long end, long total) {

    public long length() {
        return end - start + 1;
    }

    public @NonNull String toHeaderValue() {
        return String.format("bytes %d-%d/%d", start, end, total);
    }

    public static @NonNull MediaRange parse(String rangeHeader, long fileSize, long maxChunkSize) {
        String rangePrefix = "bytes=";
        if (rangeHeader == null || !rangeHeader.startsWith(rangePrefix)) {
            throw new InvalidRangeRequestException(rangeHeader, fileSize);
        }

        String rangePart = rangeHeader.substring(rangePrefix.length()).trim();
        String[] bounds = rangePart.split("-", -1);

        if (bounds.length != 2) {
            throw new InvalidRangeRequestException(rangeHeader, fileSize);
        }

        long start = 0;
        long end = fileSize - 1;

        boolean hasStart = !bounds[0].isEmpty();
        boolean hasEnd = !bounds[1].isEmpty();

        if (!hasStart && !hasEnd) {
            throw new InvalidRangeRequestException(rangeHeader, fileSize);
        }

        if (hasStart) {
            try {
                start = Long.parseLong(bounds[0]);
            } catch (NumberFormatException error) {
                throw new InvalidRangeRequestException(rangeHeader, fileSize);
            }
        }

        if (hasEnd) {
            try {
                end = Long.parseLong(bounds[1]);
            } catch (NumberFormatException error) {
                throw new InvalidRangeRequestException(rangeHeader, fileSize);
            }
            if (!hasStart) {
                start = Math.max(0, fileSize - end);
                end = fileSize - 1;
            }
        }

        if (start > end || start >= fileSize) {
            throw new InvalidRangeRequestException(rangeHeader, fileSize);
        }

        end = Math.min(end, fileSize - 1);

        if (end - start + 1 > maxChunkSize) {
            end = start + maxChunkSize - 1;
        }

        return new MediaRange(start, end, fileSize);
    }
}
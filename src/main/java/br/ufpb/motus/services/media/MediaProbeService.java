package br.ufpb.motus.services.media;

import br.ufpb.motus.model.command.CommandResult;
import br.ufpb.motus.model.media.FfprobeOutput;
import br.ufpb.motus.model.movie.MediaMetadata;
import br.ufpb.motus.services.command.CommandRunner;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.nio.file.Path;

@Service
public class MediaProbeService {

    private final ObjectMapper objectMapper;

    public MediaProbeService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Extracts deep metadata from a media file using FFprobe.
     */
    public MediaMetadata probeFile(Path filePath) {
        CommandResult result = CommandRunner.command(
                "ffprobe",
                "-v", "quiet",
                "-print_format", "json",
                "-show_format",
                "-show_streams",
                filePath.toAbsolutePath().toString()
        ).run();

        try {
            FfprobeOutput output = objectMapper.readValue(result.output(), FfprobeOutput.class);
            return mapToDomainMetadata(output);
        } catch (Exception error) {
            throw new RuntimeException("Failed to parse ffprobe output for " + filePath, error);
        }
    }

    /**
     * Generates a JPEG thumbnail from the specified video at a given timestamp.
     */
    public Path generateThumbnail(Path videoPath, Path outputDir, String timestampString) {
        String filename = videoPath.getFileName().toString() + "_thumb.jpg";
        Path outputPath = outputDir.resolve(filename);

        CommandRunner.command(
                "ffmpeg",
                "-y", // Overwrite if exists
                "-ss", timestampString,
                "-i", videoPath.toAbsolutePath().toString(),
                "-vframes", "1",
                "-q:v", "2", // High quality JPEG
                outputPath.toAbsolutePath().toString()
        ).run();

        return outputPath;
    }

    private MediaMetadata mapToDomainMetadata(FfprobeOutput output) {
        String videoCodec = "unknown";
        String audioCodec = "unknown";
        String resolution = "unknown";

        if (output.streams() != null) {
            for (FfprobeOutput.StreamInfo stream : output.streams()) {
                if ("video".equals(stream.codecType())) {
                    videoCodec = stream.codecName();
                    if (stream.width() != null && stream.height() != null) {
                        resolution = stream.width() + "x" + stream.height();
                    }
                } else if ("audio".equals(stream.codecType())) {
                    audioCodec = stream.codecName();
                }
            }
        }

        long bitrate = 0;
        long fileSize = 0;
        double durationSeconds = 0.0;

        if (output.format() != null) {
            bitrate = parseLongQuietly(output.format().bitRate());
            fileSize = parseLongQuietly(output.format().size());
            durationSeconds = parseDoubleQuietly(output.format().duration());
        }

        return new MediaMetadata(videoCodec, audioCodec, resolution, bitrate, fileSize, durationSeconds);
    }

    private long parseLongQuietly(String value) {
        if (value == null) return 0;
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }

    private double parseDoubleQuietly(String value) {
        if (value == null) return 0.0;
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException ignored) {
            return 0.0;
        }
    }
}
package br.ufpb.motus.services.media;

import br.ufpb.motus.model.command.CommandResult;
import br.ufpb.motus.model.media.FfprobeOutput;
import br.ufpb.motus.model.movie.MediaMetadata;
import br.ufpb.motus.services.command.CommandRunner;
import br.ufpb.motus.services.log.Logger;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jetbrains.annotations.Contract;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class MediaProbeService {

    private final ObjectMapper objectMapper;

    public MediaProbeService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

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

    public Path generateThumbnail(Path videoPath, Path outputDir, String timestampString) {
        String filename = videoPath.getFileName().toString() + "_thumb.jpg";
        return generateThumbnail(videoPath, outputDir, timestampString, filename);
    }

    public Path generateThumbnail(Path videoPath, Path outputDir, String timestampString, String filename) {
        Path outputPath = outputDir.resolve(filename);

        try {
            executeFfmpeg(videoPath, outputPath, timestampString);

            // Check if file was successfully created. If not, the video might be shorter than the seek timestamp.
            if (!Files.exists(outputPath) || Files.size(outputPath) == 0) {
                Logger.warn("Thumbnail empty at %s seconds, retrying at 0", timestampString);
                executeFfmpeg(videoPath, outputPath, "0");
            }
        } catch (Exception error) {
            Logger.warn("Primary thumbnail generation failed for %s: %s", videoPath, error.getMessage());
            try {
                executeFfmpeg(videoPath, outputPath, "0");
            } catch (Exception fallbackError) {
                Logger.error("Total failure generating thumbnail for: %s", fallbackError, videoPath);
                return null;
            }
        }

        return Files.exists(outputPath) ? outputPath : null;
    }

    private void executeFfmpeg(@NonNull Path videoPath, @NonNull Path outputPath, String timestamp) {
        CommandRunner.command(
                "ffmpeg",
                "-y", // Overwrite if exists
                "-ss", timestamp, // Fast seek to timestamp
                "-i", videoPath.toAbsolutePath().toString(),
                "-vframes", "1", // Extract exactly 1 frame
                "-q:v", "2", // High quality JPEG
                outputPath.toAbsolutePath().toString()
        ).run();
    }

    @Contract("_ -> new")
    private @NonNull MediaMetadata mapToDomainMetadata(@NonNull FfprobeOutput output) {
        String videoCodec = "unknown", audioCodec = "unknown", resolution = "unknown";
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

        long bitrate = output.format() != null ? parseLongQuietly(output.format().bitRate()) : 0;
        long fileSize = output.format() != null ? parseLongQuietly(output.format().size()) : 0;
        double duration = output.format() != null ? parseDoubleQuietly(output.format().duration()) : 0.0;
        return new MediaMetadata(videoCodec, audioCodec, resolution, bitrate, fileSize, duration);
    }

    private long parseLongQuietly(String value) {
        try {
            return value != null ? Long.parseLong(value) : 0;
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private double parseDoubleQuietly(String value) {
        try {
            return value != null ? Double.parseDouble(value) : 0.0;
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}
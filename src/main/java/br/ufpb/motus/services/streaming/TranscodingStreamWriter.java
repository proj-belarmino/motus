package br.ufpb.motus.services.streaming;

import br.ufpb.motus.model.network.StreamWriter;
import br.ufpb.motus.services.log.Logger;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Path;

/**
 * A StreamWriter that invokes FFmpeg as a subprocess and pipes its real-time
 * standard output directly into the HTTP response.
 */
public class TranscodingStreamWriter implements StreamWriter {

    private final Path sourcePath;
    private final String targetVideoCodec;
    private final String targetAudioCodec;
    private final String containerFormat;

    public TranscodingStreamWriter(Path sourcePath, String targetVideoCodec, String targetAudioCodec, String containerFormat) {
        this.sourcePath = sourcePath;
        this.targetVideoCodec = targetVideoCodec;
        this.targetAudioCodec = targetAudioCodec;
        this.containerFormat = containerFormat;
    }

    @Override
    public void writeTo(OutputStream output) throws IOException {
        ProcessBuilder processBuilder = new ProcessBuilder(
                "ffmpeg",
                "-i", sourcePath.toAbsolutePath().toString(),
                "-c:v", targetVideoCodec,
                "-preset", "veryfast", // Optimise for latency
                "-c:a", targetAudioCodec,
                "-f", containerFormat,
                "-movflags", "frag_keyframe+empty_moov+default_base_moof",
                "pipe:1" // Output to stdout
        );

        processBuilder.redirectError(ProcessBuilder.Redirect.DISCARD);

        Process process = null;
        try {
            process = processBuilder.start();
            try (InputStream ffmpegOut = process.getInputStream()) {
                ffmpegOut.transferTo(output);
            }
        } catch (IOException error) {
            throw new IOException("Transcoding stream interrupted.", error);
        } finally {
            if (process != null && process.isAlive()) {
                Logger.trace("Destroying FFmpeg transcoding process for: %s", sourcePath);
                process.destroyForcibly();
            }
        }
    }
}
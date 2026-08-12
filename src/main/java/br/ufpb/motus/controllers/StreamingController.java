package br.ufpb.motus.controllers;

import br.ufpb.motus.model.exception.ResourceNotFoundException;
import br.ufpb.motus.model.exception.StreamingOperationException;
import br.ufpb.motus.model.movie.MovieEntity;
import br.ufpb.motus.model.network.MediaStreamResult;
import br.ufpb.motus.model.show.EpisodeEntity;
import br.ufpb.motus.services.log.Logger;
import br.ufpb.motus.services.movie.MovieRepository;
import br.ufpb.motus.services.show.EpisodeRepository;
import br.ufpb.motus.services.streaming.StreamingService;
import br.ufpb.motus.services.streaming.TranscodingStreamWriter;
import org.jetbrains.annotations.Contract;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

@RestController
@RequestMapping("/api/stream")
public class StreamingController {

    private final StreamingService streamingService;
    private final MovieRepository movieRepository;
    private final EpisodeRepository episodeRepository;

    public StreamingController(StreamingService streamingService, MovieRepository movieRepository, EpisodeRepository episodeRepository) {
        this.streamingService = streamingService;
        this.movieRepository = movieRepository;
        this.episodeRepository = episodeRepository;
    }

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<StreamingResponseBody> streamMovie(
            @PathVariable String movieId,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader,
            @RequestParam(defaultValue = "false") boolean transcode) {

        Path filePath = resolveMoviePath(movieId);
        MediaStreamResult result;

        if (transcode) {
            // generates a real-time fragmented mp4 with unknown content length to bypass range mechanics
            result = new MediaStreamResult(
                    -1L,
                    "video/mp4",
                    Optional.empty(),
                    new TranscodingStreamWriter(filePath, "libx264", "aac", "mp4")
            );
        } else {
            result = acquireStreamResult(filePath, rangeHeader);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(result.contentType()));
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");

        // only set content length if it is known (bypassed during live transcode streaming)
        if (result.contentLength() >= 0) {
            headers.setContentLength(result.contentLength());
        }

        HttpStatus status = HttpStatus.OK;

        if (result.range().isPresent()) {
            status = HttpStatus.PARTIAL_CONTENT;
            headers.set(HttpHeaders.CONTENT_RANGE, result.range().get().toHeaderValue());
        }

        return new ResponseEntity<>(wrapPayload(result, filePath), headers, status);
    }

    @GetMapping("/movie/{movieId}/download")
    public ResponseEntity<StreamingResponseBody> downloadMovie(@PathVariable String movieId) {

        Path filePath = resolveMoviePath(movieId);
        // force full stream without boundaries
        MediaStreamResult result = acquireStreamResult(filePath, null);

        String filename = filePath.getFileName().toString();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(result.contentType()));
        headers.setContentLength(result.contentLength());
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");

        return new ResponseEntity<>(wrapPayload(result, filePath), headers, HttpStatus.OK);
    }

    @GetMapping("/episode/{episodeId}")
    public ResponseEntity<StreamingResponseBody> streamEpisode(
            @PathVariable String episodeId,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader,
            @RequestParam(defaultValue = "false") boolean transcode) {

        Path filePath = resolveEpisodePath(episodeId);
        MediaStreamResult result;

        if (transcode) {
            result = new MediaStreamResult(
                    -1L,
                    "video/mp4",
                    Optional.empty(),
                    new TranscodingStreamWriter(filePath, "libx264", "aac", "mp4")
            );
        } else {
            result = acquireStreamResult(filePath, rangeHeader);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(result.contentType()));
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");

        if (result.contentLength() >= 0) {
            headers.setContentLength(result.contentLength());
        }

        HttpStatus status = HttpStatus.OK;

        if (result.range().isPresent()) {
            status = HttpStatus.PARTIAL_CONTENT;
            headers.set(HttpHeaders.CONTENT_RANGE, result.range().get().toHeaderValue());
        }

        return new ResponseEntity<>(wrapPayload(result, filePath), headers, status);
    }

    private @NonNull Path resolveMoviePath(String movieId) {
        MovieEntity movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", movieId));

        Path filePath = Paths.get(movie.getFilePath());
        if (!Files.exists(filePath)) {
            throw new ResourceNotFoundException("File", filePath.toString());
        }
        return filePath;
    }

    private @NonNull Path resolveEpisodePath(String episodeId) {
        EpisodeEntity episode = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Episode", episodeId));

        Path filePath = Paths.get(episode.getFilePath());
        if (!Files.exists(filePath)) {
            throw new ResourceNotFoundException("File", filePath.toString());
        }
        return filePath;
    }

    private @NonNull MediaStreamResult acquireStreamResult(Path filePath, String rangeHeader) {
        try {
            return streamingService.resolveStream(filePath, rangeHeader);
        } catch (IOException error) {
            throw new StreamingOperationException("Failed to prepare file for streaming.", error);
        }
    }

    @Contract(pure = true)
    private @NonNull StreamingResponseBody wrapPayload(MediaStreamResult result, Path filePath) {
        return outputStream -> {
            try {
                result.payloadWriter().writeTo(outputStream);
            } catch (IOException error) {
                String message = error.getMessage();

                // mute stack traces generated merely by clients dropping their connections during a transfer
                boolean isClientAbort = message != null && (message.contains("Broken pipe") || message.contains("Connection reset"));
                if (isClientAbort) {
                    Logger.trace("Client cancelled stream segment for: %s", filePath);
                } else {
                    Logger.warn("Unexpected I/O error during streaming of %s: %s", filePath, message);
                }
            }
        };
    }
}
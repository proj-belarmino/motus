package br.ufpb.motus.controllers;

import br.ufpb.motus.model.exception.ResourceNotFoundException;
import br.ufpb.motus.model.exception.StreamingOperationException;
import br.ufpb.motus.model.movie.Movie;
import br.ufpb.motus.model.movie.Subtitle;
import br.ufpb.motus.model.query.SearchQuery;
import br.ufpb.motus.services.movie.MovieService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @GetMapping
    public ResponseEntity<Page<Movie>> getMovies(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String director,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "title") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortOrder,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        SearchQuery query = new SearchQuery(title, genre, year, director, minRating, sortBy, sortOrder, page, size);
        Page<Movie> results = movieService.searchMovies(query);

        return ResponseEntity.ok(results);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Movie> getMovie(@PathVariable String id) {
        return ResponseEntity.ok(movieService.getMovie(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable String id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/scan")
    public ResponseEntity<Void> triggerScan() {
        movieService.triggerBackgroundScan();
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/upload")
    public ResponseEntity<Void> uploadMovie(@RequestParam("file") MultipartFile file) {
        movieService.uploadMovie(file);
        return ResponseEntity.accepted().build();
    }

    public record TitleUpdateRequest(String title) {
    }

    @PutMapping("/{id}/title")
    public ResponseEntity<Movie> updateTitle(@PathVariable String id, @RequestBody TitleUpdateRequest request) {
        return ResponseEntity.ok(movieService.updateTitle(id, request.title()));
    }

    @PostMapping("/{id}/refresh")
    public ResponseEntity<Movie> refreshMovie(@PathVariable String id) {
        return ResponseEntity.ok(movieService.refreshMovie(id));
    }

    @PostMapping("/{id}/subtitles")
    public ResponseEntity<Movie> uploadSubtitle(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String language) {
        return ResponseEntity.ok(movieService.uploadSubtitle(id, file, language));
    }

    @DeleteMapping("/{id}/subtitles/{subtitleId}")
    public ResponseEntity<Movie> deleteSubtitle(@PathVariable String id, @PathVariable String subtitleId) {
        return ResponseEntity.ok(movieService.deleteSubtitle(id, subtitleId));
    }

    @GetMapping("/{id}/subtitles/{subtitleId}/file")
    public ResponseEntity<byte[]> getSubtitleFile(@PathVariable String id, @PathVariable String subtitleId) {
        Movie movie = movieService.getMovie(id);
        Subtitle subtitle = movie.subtitles().stream()
                .filter(candidate -> candidate.id().equals(subtitleId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Subtitle", subtitleId));

        try {
            byte[] content = Files.readAllBytes(Paths.get(subtitle.filePath()));
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("text/vtt; charset=utf-8"))
                    .contentLength(content.length)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + subtitleId + ".vtt\"")
                    .body(content);
        } catch (IOException error) {
            throw new StreamingOperationException("Failed to read subtitle file.", error);
        }
    }
}

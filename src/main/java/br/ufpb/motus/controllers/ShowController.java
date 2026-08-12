package br.ufpb.motus.controllers;

import br.ufpb.motus.model.show.Show;
import br.ufpb.motus.model.show.ShowSearchResult;
import br.ufpb.motus.services.show.ShowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/shows")
public class ShowController {

    private final ShowService showService;

    public ShowController(ShowService showService) {
        this.showService = showService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<ShowSearchResult>> searchShows(@RequestParam String q) {
        return ResponseEntity.ok(showService.searchShows(q));
    }

    public record CreateShowRequest(String title, Integer tmdbId) {}

    @PostMapping
    public ResponseEntity<Show> createShow(@RequestBody CreateShowRequest request) {
        return ResponseEntity.ok(showService.createShow(request.title(), request.tmdbId()));
    }

    @GetMapping
    public ResponseEntity<List<Show>> getShows() {
        return ResponseEntity.ok(showService.getShows());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Show> getShow(@PathVariable String id) {
        return ResponseEntity.ok(showService.getShow(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShow(@PathVariable String id) {
        showService.deleteShow(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/episodes")
    public ResponseEntity<Show> uploadEpisode(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Integer season,
            @RequestParam(required = false) Integer episode) {
        return ResponseEntity.ok(showService.uploadEpisode(id, file, season, episode));
    }

    @DeleteMapping("/{id}/episodes/{episodeId}")
    public ResponseEntity<Show> deleteEpisode(@PathVariable String id, @PathVariable String episodeId) {
        return ResponseEntity.ok(showService.deleteEpisode(id, episodeId));
    }
}
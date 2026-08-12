package br.ufpb.motus.controllers;

import br.ufpb.motus.model.user.ChangeEmailRequest;
import br.ufpb.motus.model.user.ChangePasswordRequest;
import br.ufpb.motus.services.user.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import br.ufpb.motus.model.user.ActivityDay;
import java.util.List;
import br.ufpb.motus.model.movie.Movie;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal String userId,
            @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userId, request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/email")
    public ResponseEntity<Void> changeEmail(
            @AuthenticationPrincipal String userId,
            @RequestBody ChangeEmailRequest request) {
        userService.changeEmail(userId, request);
        return ResponseEntity.noContent().build();
    }

    public record ProfileUpdateRequest(
            String name,
            String handle,
            String email,
            String currentPassword,
            String newPassword
    ) {}

    @PutMapping("/profile")
    public ResponseEntity<br.ufpb.motus.model.user.AuthResponse> updateProfile(
            @AuthenticationPrincipal String userId,
            @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(userService.updateProfile(userId, request));
    }

    @PostMapping("/avatar")
    public ResponseEntity<br.ufpb.motus.model.user.AuthResponse> updateAvatar(@AuthenticationPrincipal String userId, @RequestParam("file") MultipartFile file) { return ResponseEntity.ok(userService.updateAvatar(userId, file)); }

    public record ActivityRequest(String movieId) {}

    @PostMapping("/activity")
    public ResponseEntity<Void> recordActivity(@AuthenticationPrincipal String userId, @RequestBody ActivityRequest request) { userService.recordActivity(userId, request.movieId()); return ResponseEntity.noContent().build(); }

    @GetMapping("/activity")
    public ResponseEntity<List<ActivityDay>> getActivity(@AuthenticationPrincipal String userId) { return ResponseEntity.ok(userService.getActivity(userId)); }

    @GetMapping("/recent")
    public ResponseEntity<List<Movie>> getRecentMovies(@AuthenticationPrincipal String userId) { return ResponseEntity.ok(userService.getRecentMovies(userId)); }

    @GetMapping("/next-up")
    public ResponseEntity<List<br.ufpb.motus.model.user.NextUpItem>> getNextUp(
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "12") int limit) {
        return ResponseEntity.ok(userService.getNextUp(userId, limit));
    }

    public record FavoriteRequest(String movieId) {}
    public record FavoriteResponse(boolean favorited) {}
    public record WatchlistRequest(String movieId) {}
    public record WatchlistResponse(boolean inWatchlist) {}

    @PostMapping("/favorites/toggle")
    public ResponseEntity<FavoriteResponse> toggleFavorite(@AuthenticationPrincipal String userId, @RequestBody FavoriteRequest request) { return ResponseEntity.ok(new FavoriteResponse(userService.toggleFavorite(userId, request.movieId()))); }

    @GetMapping("/favorites")
    public ResponseEntity<List<Movie>> getFavorites(@AuthenticationPrincipal String userId) { return ResponseEntity.ok(userService.getFavorites(userId)); }

    @GetMapping("/favorites/is-favorite")
    public ResponseEntity<FavoriteResponse> isFavorite(@AuthenticationPrincipal String userId, @RequestParam String movieId) { return ResponseEntity.ok(new FavoriteResponse(userService.isFavorite(userId, movieId))); }

    @PostMapping("/watchlist/toggle")
    public ResponseEntity<WatchlistResponse> toggleWatchlist(@AuthenticationPrincipal String userId, @RequestBody WatchlistRequest request) { return ResponseEntity.ok(new WatchlistResponse(userService.toggleWatchlist(userId, request.movieId()))); }

    @GetMapping("/watchlist")
    public ResponseEntity<List<Movie>> getWatchlist(@AuthenticationPrincipal String userId) { return ResponseEntity.ok(userService.getWatchlist(userId)); }

    @GetMapping("/watchlist/is-on-watchlist")
    public ResponseEntity<WatchlistResponse> isOnWatchlist(@AuthenticationPrincipal String userId, @RequestParam String movieId) { return ResponseEntity.ok(new WatchlistResponse(userService.isInWatchlist(userId, movieId))); }
}

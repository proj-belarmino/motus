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
}
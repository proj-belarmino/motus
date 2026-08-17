package br.ufpb.motus.controllers;

import br.ufpb.motus.model.user.AuthResponse;
import br.ufpb.motus.model.user.LoginRequest;
import br.ufpb.motus.model.user.RegisterRequest;
import br.ufpb.motus.services.security.AuthService;
import br.ufpb.motus.security.MediaAuthCookieService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final MediaAuthCookieService mediaAuthCookieService;

    public AuthController(AuthService authService, MediaAuthCookieService mediaAuthCookieService) {
        this.authService = authService;
        this.mediaAuthCookieService = mediaAuthCookieService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, mediaAuthCookieService.buildCookie(response.token(), httpRequest.isSecure()))
                .body(response);
    }

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest) {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, mediaAuthCookieService.clearCookie(httpRequest.isSecure()))
                .build();
    }
}
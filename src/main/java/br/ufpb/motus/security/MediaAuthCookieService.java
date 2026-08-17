package br.ufpb.motus.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class MediaAuthCookieService {

    public static final String COOKIE_NAME = "motus_media_token";
    private final long expirationHours;

    public MediaAuthCookieService(@Value("${motus.security.jwt.expiration-hours:168}") long expirationHours) {
        this.expirationHours = expirationHours;
    }

    public String buildCookie(String token, boolean secure) {
        return ResponseCookie.from(COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/api")
                .maxAge(Duration.ofHours(expirationHours))
                .build()
                .toString();
    }

    public String clearCookie(boolean secure) {
        return ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/api")
                .maxAge(Duration.ZERO)
                .build()
                .toString();
    }
}

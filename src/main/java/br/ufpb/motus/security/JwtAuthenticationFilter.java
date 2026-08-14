package br.ufpb.motus.security;

import br.ufpb.motus.services.security.JwtService;
import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null) {
            try {
                DecodedJWT jwt = jwtService.verifyToken(token);

                String userId = jwt.getSubject();
                String role = jwt.getClaim("role").asString();

                var auth = new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))
                );

                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception ignored) {

            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }

        // Browsers loading a direct <video src="..."> or <track> lack header control.
        // We permit supplying it as a URI parameter strictly, and only for the
        // media endpoints that actually need it, to avoid leaking the token into
        // URLs (logs, history, Referer headers) of other API calls.
        if (isMediaUrlRequest(request)) {
            return request.getParameter("token");
        }

        return null;
    }

    private boolean isMediaUrlRequest(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null) {
            return false;
        }
        return uri.startsWith("/api/stream/")
                || uri.matches("^/api/movies/[^/]+/subtitles/[^/]+/file$");
    }
}
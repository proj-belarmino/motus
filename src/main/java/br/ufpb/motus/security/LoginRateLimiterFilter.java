package br.ufpb.motus.security;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Bounds login attempts per client IP to blunt password brute-force attacks.
 * Sliding one-minute window; expired entries are purged by a background task.
 */
public class LoginRateLimiterFilter extends OncePerRequestFilter {

    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_MILLIS = TimeUnit.MINUTES.toMillis(1);

    private final ConcurrentHashMap<String, Deque<Long>> attempts = new ConcurrentHashMap<>();
    private final ScheduledExecutorService cleanup = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread thread = new Thread(r, "login-rate-limiter-cleanup");
        thread.setDaemon(true);
        return thread;
    });

    @PostConstruct
    void startCleanup() {
        cleanup.scheduleAtFixedRate(this::purge, 5, 5, TimeUnit.MINUTES);
    }

    @PreDestroy
    void stopCleanup() {
        cleanup.shutdownNow();
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return !"POST".equalsIgnoreCase(request.getMethod())
                || !"/api/auth/login".equals(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String key = clientKey(request);
        long now = System.currentTimeMillis();

        Deque<Long> window = attempts.compute(key, (k, deque) -> {
            Deque<Long> current = deque != null ? deque : new ConcurrentLinkedDeque<>();
            while (!current.isEmpty() && now - current.peekFirst() > WINDOW_MILLIS) {
                current.pollFirst();
            }
            current.addLast(now);
            return current;
        });

        if (window.size() > MAX_ATTEMPTS) {
            response.sendError(HttpStatus.TOO_MANY_REQUESTS.value(),
                    "Too many login attempts. Try again later.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String clientKey(HttpServletRequest request) {
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    private void purge() {
        long now = System.currentTimeMillis();
        attempts.entrySet().removeIf(entry -> {
            Deque<Long> deque = entry.getValue();
            while (!deque.isEmpty() && now - deque.peekFirst() > WINDOW_MILLIS) {
                deque.pollFirst();
            }
            return deque.isEmpty();
        });
    }
}

package br.ufpb.motus.services.network;

import org.jspecify.annotations.NonNull;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

final class NetworkEngine {
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(10);
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(CONNECT_TIMEOUT)
            .build();

    // Regular request send.
    public String sendForString(HttpRequest request, String url) {
        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            validateStatus(response.statusCode(), url);
            return response.body();
        } catch (IOException error) {
            throw new UncheckedIOException(error);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(String.format("HTTP execution interrupted for %s", url), error);
        }
    }

    // Streamed request send.
    public @NonNull HttpResponse<InputStream> sendForStream(HttpRequest request, String url) {
        try {
            HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
            validateStatus(response.statusCode(), url);
            return response;
        } catch (IOException error) {
            throw new UncheckedIOException(error);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(String.format("HTTP stream execution interrupted for %s", url), error);
        }
    }

    // Check if there was an error and throw.
    private void validateStatus(int statusCode, String url) {
        if (statusCode < 200 || statusCode >= 300) {
            throw new RuntimeException(String.format("HTTP request failed with status: %d for %s", statusCode, url));
        }
    }
}
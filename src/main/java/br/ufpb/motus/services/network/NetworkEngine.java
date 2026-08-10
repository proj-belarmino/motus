package br.ufpb.motus.services.network;

import br.ufpb.motus.model.exception.NetworkOperationException;
import org.jspecify.annotations.NonNull;

import java.io.IOException;
import java.io.InputStream;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

final class NetworkEngine {
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(10);
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(CONNECT_TIMEOUT)
            .build();

    public @NonNull String sendForString(@NonNull HttpRequest request, @NonNull String url) {
        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            validateStatus(response.statusCode(), url);
            return response.body();
        } catch (IOException error) {
            throw new NetworkOperationException("io error during network request", url, -1, error);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new NetworkOperationException("network request interrupted", url, -1, error);
        }
    }

    public @NonNull HttpResponse<InputStream> sendForStream(@NonNull HttpRequest request, @NonNull String url) {
        try {
            HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
            validateStatus(response.statusCode(), url);
            return response;
        } catch (IOException error) {
            throw new NetworkOperationException("io error during range stream request", url, -1, error);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new NetworkOperationException("range stream request interrupted", url, -1, error);
        }
    }

    private void validateStatus(int statusCode, @NonNull String url) {
        if (statusCode < 200 || statusCode >= 300) {
            throw new NetworkOperationException("http request failed", url, statusCode, null);
        }
    }
}
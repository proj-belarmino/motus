package br.ufpb.motus.services.network;

import br.ufpb.motus.model.exception.NetworkOperationException;
import br.ufpb.motus.model.network.RangeResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class NetworkClient {

    private final ObjectMapper objectMapper;
    private final NetworkEngine engine = new NetworkEngine();
    private final RetryExecutor retryExecutor = new RetryExecutor(3, 500);

    public <Type> Type get(@NonNull String url, @NonNull Class<Type> responseType, @NonNull Map<String, String> headers) {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET();

        headers.forEach(builder::header);
        HttpRequest request = builder.build();

        return retryExecutor.execute(() -> {
            try {
                String responseBody = engine.sendForString(request, url);
                return objectMapper.readValue(responseBody, responseType);
            } catch (IOException error) {
                throw new NetworkOperationException("io error parsing network response", url, -1, error);
            }
        }, url);
    }

    public @NonNull RangeResponse fetchRange(@NonNull String url, @Nullable String rangeHeader, @NonNull Map<String, String> headers) {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET();

        if (rangeHeader != null && !rangeHeader.isBlank()) {
            builder.header("Range", rangeHeader);
        }

        headers.forEach(builder::header);
        HttpRequest request = builder.build();

        HttpResponse<InputStream> response = engine.sendForStream(request, url);
        long contentLength = response.headers().firstValueAsLong("Content-Length").orElse(-1L);
        String contentRange = response.headers().firstValue("Content-Range").orElse("");

        return new RangeResponse(response.body(), contentLength, contentRange, response.statusCode());
    }
}
package br.ufpb.motus.services.network;

import br.ufpb.motus.model.RangeResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jetbrains.annotations.Contract;
import org.jspecify.annotations.NonNull;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

public final class NetworkClient {
    private static final NetworkEngine ENGINE = new NetworkEngine();
    private static final RetryExecutor RETRY_EXECUTOR = new RetryExecutor(5, 200);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private NetworkClient() {}

    public static <Type> Type get(String url, Class<Type> responseType) {
        return get(url, responseType, Map.of());
    }

    public static <Type> Type get(String url, Class<Type> responseType, @NonNull Map<String, String> headers) {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET();
        headers.forEach(builder::header);
        HttpRequest request = builder.build();

        return RETRY_EXECUTOR.execute(() -> {
            String jsonResponse = ENGINE.sendForString(request, url);
            return deserialize(jsonResponse, responseType);
        });
    }

    public static @NonNull RangeResponse fetchRange(String url, long startByte, Long endByte) {
        Object end = endByte != null ? endByte : "";
        String rangeHeader = String.format("bytes=%d-%s", startByte, end);
        return fetchRange(url, rangeHeader, Map.of());
    }

    @Contract("_, _, _ -> new")
    public static @NonNull RangeResponse fetchRange(String url, String rangeHeader, @NonNull Map<String, String> headers) {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Range", rangeHeader)
                .GET();
        headers.forEach(builder::header);
        HttpRequest request = builder.build();

        HttpResponse<InputStream> response = ENGINE.sendForStream(request, url);

        long contentLength = response.headers().firstValueAsLong("Content-Length").orElse(-1L);
        String contentRange = response.headers().firstValue("Content-Range").orElse("");

        return new RangeResponse(response.body(), contentLength, contentRange, response.statusCode());
    }

    private static <Type> Type deserialize(String json, Class<Type> type) {
        try {
            return OBJECT_MAPPER.readValue(json, type);
        } catch (IOException error) {
            throw new UncheckedIOException(error);
        }
    }
}
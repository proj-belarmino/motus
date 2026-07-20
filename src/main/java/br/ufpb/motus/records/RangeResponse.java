package br.ufpb.motus.records;

import java.io.InputStream;

public record RangeResponse(
        InputStream stream,
        long contentLength,
        String contentRange,
        int statusCode
) implements  AutoCloseable {
    @Override
    public void close() {
        try {
            if (stream != null) {
                stream.close();
            }
        } catch (Exception error) {
            throw new RuntimeException("Failed to close range stream", error);
        }
    }
}

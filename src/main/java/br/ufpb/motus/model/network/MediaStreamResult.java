package br.ufpb.motus.model.network;

import org.jspecify.annotations.NonNull;

import java.util.Optional;

/**
 * encapsulates the parameters and lazy execution context for an outgoing media stream.
 */
public record MediaStreamResult(
        long contentLength,
        @NonNull String contentType,
        @NonNull Optional<MediaRange> range,
        @NonNull StreamWriter payloadWriter
) {}
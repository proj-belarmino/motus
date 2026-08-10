package br.ufpb.motus.model.movie;

import org.jspecify.annotations.Nullable;

public record MediaMetadata(
        @Nullable String videoCodec,
        @Nullable String audioCodec,
        @Nullable String resolution,
        long bitrate,
        long fileSize,
        double durationSeconds
) {}
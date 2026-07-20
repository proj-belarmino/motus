package br.ufpb.motus.model;

public record MediaMetadata(
        String videoCodec,
        String audioCodec,
        String resolution,
        long bitrate,
        long fileSize,
        double durationSeconds
) {}

package br.ufpb.motus.model;

public record MediaFile(
    String id,
    String title,
    String absolutePath,
    String contentType
) {}

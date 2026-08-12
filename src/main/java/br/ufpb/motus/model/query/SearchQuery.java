package br.ufpb.motus.model.query;

public record SearchQuery(
    String title,
    String genre,
    Integer year,
    String director,
    Double minRating,
    String sortBy,
    String sortOrder,
    int page,
    int size,
    java.time.LocalDate addedSince
) {}

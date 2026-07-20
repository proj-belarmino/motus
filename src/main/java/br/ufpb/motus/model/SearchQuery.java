package br.ufpb.motus.model;

public record SearchQuery(
    String genre,
    Integer year,
    String director,
    Double minRating,
    String sortBy,
    String sortOrder,
    int page,
    int size
) {}

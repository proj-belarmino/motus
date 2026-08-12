package br.ufpb.motus.model.show;

import java.util.List;

public record ShowSearchResult(
        int tmdbId,
        String title,
        String year,
        String overview,
        String posterUrl,
        double rating,
        List<String> genres
) {}
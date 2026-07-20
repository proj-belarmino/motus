package br.ufpb.motus.model;

import java.time.LocalDate;
import java.util.List;

public record ExternalMovieInfo(
        String title,
        String originalTitle,
        String director,
        String coverUrl,
        String overview,
        LocalDate releaseDate,
        List<String> genres,
        double rating
) {}

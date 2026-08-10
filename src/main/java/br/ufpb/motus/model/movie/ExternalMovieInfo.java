package br.ufpb.motus.model.movie;

import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.util.List;

public record ExternalMovieInfo(
        @NonNull String title,
        @Nullable String originalTitle,
        @Nullable String director,
        @Nullable String coverUrl,
        @Nullable String overview,
        @Nullable LocalDate releaseDate,
        @NonNull List<String> genres,
        double rating
) {}
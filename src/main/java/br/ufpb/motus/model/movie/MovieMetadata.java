package br.ufpb.motus.model.movie;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MovieMetadata(
    UUID id,
    String title,
    String originalTitle,
    String filePath,
    String coverPath,
    String fileHash,
    LocalDate releaseDate,
    List<String> genres,
    MediaMetadata mediaMetadata,
    double rating
) {}

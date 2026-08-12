package br.ufpb.motus.model.show;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.jetbrains.annotations.Contract;
import org.jspecify.annotations.NonNull;

import java.time.LocalDate;
import java.util.List;

public record Show(
        @JsonProperty("id") String id,
        @JsonProperty("title") String title,
        @JsonProperty("original_title") String originalTitle,
        @JsonProperty("overview") String overview,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        @JsonProperty("release_date") LocalDate releaseDate,

        @JsonProperty("genres") List<String> genres,
        @JsonProperty("rating") double rating,
        @JsonProperty("cover_path") String coverPath,
        @JsonProperty("status") String status,
        @JsonProperty("number_of_seasons") int numberOfSeasons,
        @JsonProperty("tmdb_id") Integer tmdbId,
        @JsonProperty("episodes") List<Episode> episodes
) {

    @Contract("_, _ -> new")
    public static @NonNull Show fromEntity(@NonNull ShowEntity entity, @NonNull List<EpisodeEntity> episodeEntities) {
        List<Episode> episodes = episodeEntities.stream().map(Episode::fromEntity).toList();
        return new Show(
                entity.getId(),
                entity.getTitle(),
                entity.getOriginalTitle(),
                entity.getOverview(),
                entity.getReleaseDate(),
                entity.getGenres(),
                entity.getRating(),
                entity.getCoverPath(),
                entity.getStatus(),
                entity.getNumberOfSeasons(),
                entity.getTmdbId(),
                episodes
        );
    }
}
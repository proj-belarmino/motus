package br.ufpb.motus.model.show;

import br.ufpb.motus.model.movie.MediaMetadata;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.jetbrains.annotations.Contract;
import org.jspecify.annotations.NonNull;

import java.time.LocalDate;

public record Episode(
        @JsonProperty("id") String id,
        @JsonProperty("show_id") String showId,
        @JsonProperty("season_number") int seasonNumber,
        @JsonProperty("episode_number") int episodeNumber,
        @JsonProperty("title") String title,
        @JsonProperty("overview") String overview,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        @JsonProperty("release_date") LocalDate releaseDate,

        @JsonProperty("file_path") String filePath,
        @JsonProperty("file_hash") String fileHash,
        @JsonProperty("cover_path") String coverPath,
        @JsonProperty("metadata") MediaMetadata metadata
) {

    @Contract("_ -> new")
    public static @NonNull Episode fromEntity(@NonNull EpisodeEntity entity) {
        return new Episode(
                entity.getId(),
                entity.getShowId(),
                entity.getSeasonNumber(),
                entity.getEpisodeNumber(),
                entity.getTitle(),
                entity.getOverview(),
                entity.getReleaseDate(),
                entity.getFilePath(),
                entity.getFileHash(),
                entity.getCoverPath(),
                entity.getMetadata()
        );
    }
}
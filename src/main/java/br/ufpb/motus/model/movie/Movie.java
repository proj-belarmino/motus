package br.ufpb.motus.model.movie;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.jetbrains.annotations.Contract;
import org.jspecify.annotations.NonNull;

import java.time.LocalDate;
import java.util.List;

public record Movie(
        @JsonProperty("id") String id,
        @JsonProperty("title") String title,
        @JsonProperty("original_title") String originalTitle,
        @JsonProperty("file_path") String filePath,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        @JsonProperty("release_date") LocalDate releaseDate,

        @JsonProperty("director") String director,
        @JsonProperty("genres") List<String> genres,
        @JsonProperty("rating") double rating,
        @JsonProperty("cover_path") String coverPath,
        @JsonProperty("file_hash") String fileHash,
        @JsonProperty("metadata") MediaMetadata metadata
) {

    @Contract("_ -> new")
    public static @NonNull Movie fromEntity(@NonNull MovieEntity entity) {
        return new Movie(
                entity.getId(),
                entity.getTitle(),
                entity.getOriginalTitle(),
                entity.getFilePath(),
                entity.getReleaseDate(),
                entity.getDirector(),
                entity.getGenres(),
                entity.getRating(),
                entity.getCoverPath(),
                entity.getFileHash(),
                entity.getMetadata()
        );
    }

    @Contract(" -> new")
    public @NonNull MovieEntity toEntity() {
        return new MovieEntity(
                this.id(),
                this.title(),
                this.originalTitle(),
                this.filePath(),
                this.releaseDate(),
                this.director(),
                this.genres(),
                this.rating(),
                this.coverPath(),
                this.fileHash(),
                this.metadata()
        );
    }
}
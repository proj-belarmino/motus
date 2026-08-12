package br.ufpb.motus.model.show;

import br.ufpb.motus.model.movie.MediaMetadata;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "episode")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EpisodeEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "show_id", nullable = false)
    private String showId;

    @Column(name = "season_number", nullable = false)
    private int seasonNumber;

    @Column(name = "episode_number", nullable = false)
    private int episodeNumber;

    @Column(name = "title")
    private String title;

    @Column(name = "overview", columnDefinition = "text")
    private String overview;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(name = "file_path", nullable = false, unique = true)
    private String filePath;

    @Column(name = "file_hash")
    private String fileHash;

    @Column(name = "cover_path")
    private String coverPath;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private MediaMetadata metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
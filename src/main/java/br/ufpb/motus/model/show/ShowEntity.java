package br.ufpb.motus.model.show;

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
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tv_show")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShowEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "original_title")
    private String originalTitle;

    @Column(name = "overview", columnDefinition = "text")
    private String overview;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "genres", columnDefinition = "jsonb")
    private List<String> genres = new ArrayList<>();

    @Column(name = "rating")
    private double rating;

    @Column(name = "cover_path")
    private String coverPath;

    @Column(name = "status")
    private String status;

    @Column(name = "number_of_seasons")
    private int numberOfSeasons;

    @Column(name = "tmdb_id")
    private Integer tmdbId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
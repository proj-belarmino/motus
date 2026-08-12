package br.ufpb.motus.model.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "user_watchlist")
@Getter
@Setter
@NoArgsConstructor
public class UserWatchlistEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "movie_id", nullable = false)
    private String movieId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UserWatchlistEntity(String userId, String movieId) {
        this.userId = userId;
        this.movieId = movieId;
        this.createdAt = Instant.now();
    }
}
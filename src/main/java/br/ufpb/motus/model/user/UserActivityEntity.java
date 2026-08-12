package br.ufpb.motus.model.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "user_activity")
@Getter @Setter @NoArgsConstructor
public class UserActivityEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private String userId;
    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;
    @Column(name = "movie_id")
    private String movieId;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    public UserActivityEntity(String userId, LocalDate activityDate, String movieId) { this.userId = userId; this.activityDate = activityDate; this.movieId = movieId; this.createdAt = Instant.now(); }
}

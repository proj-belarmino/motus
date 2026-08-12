package br.ufpb.motus.services.user;

import br.ufpb.motus.model.user.UserWatchlistEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserWatchlistRepository extends JpaRepository<UserWatchlistEntity, Long> {
    boolean existsByUserIdAndMovieId(String userId, String movieId);

    Optional<UserWatchlistEntity> findByUserIdAndMovieId(String userId, String movieId);

    void deleteByUserIdAndMovieId(String userId, String movieId);

    @Query("select w.movieId from UserWatchlistEntity w where w.userId = :userId order by w.createdAt desc")
    List<String> findMovieIdsByUserId(@Param("userId") String userId);
}
package br.ufpb.motus.services.user;

import br.ufpb.motus.model.user.UserFavoriteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserFavoriteRepository extends JpaRepository<UserFavoriteEntity, Long> {
    boolean existsByUserIdAndMovieId(String userId, String movieId);

    Optional<UserFavoriteEntity> findByUserIdAndMovieId(String userId, String movieId);

    void deleteByUserIdAndMovieId(String userId, String movieId);

    @Query("select f.movieId from UserFavoriteEntity f where f.userId = :userId order by f.createdAt desc")
    List<String> findMovieIdsByUserId(@Param("userId") String userId);
}
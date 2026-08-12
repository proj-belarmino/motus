package br.ufpb.motus.services.user;

import br.ufpb.motus.model.user.UserActivityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface UserActivityRepository extends JpaRepository<UserActivityEntity, Long> {
    @Query("select a.activityDate, count(a) from UserActivityEntity a where a.userId = :userId and a.activityDate >= :from group by a.activityDate")
    List<Object[]> findDailyCounts(@Param("userId") String userId, @Param("from") LocalDate from);

    @Query(value = "select movie_id from (select distinct on (movie_id) movie_id, created_at from user_activity where user_id = :userId and movie_id is not null order by movie_id, created_at desc) recent order by created_at desc limit :limit", nativeQuery = true)
    List<String> findRecentMovieIds(@Param("userId") String userId, @Param("limit") int limit);
}

package br.ufpb.motus.services.movie;

import br.ufpb.motus.model.movie.MovieEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface MovieRepository extends JpaRepository<MovieEntity, String>, JpaSpecificationExecutor<MovieEntity> {

    Optional<MovieEntity> findByFilePath(String filePath);

    boolean existsByFilePath(String filePath);

    void deleteByFilePath(String filePath);

    @Query("SELECT m.coverPath FROM MovieEntity m WHERE m.coverPath IS NOT NULL")
    Set<String> findAllCoverPaths();
}
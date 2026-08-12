package br.ufpb.motus.services.show;

import br.ufpb.motus.model.show.ShowEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShowRepository extends JpaRepository<ShowEntity, String> {
    List<ShowEntity> findAllByOrderByTitleAsc();

    Optional<ShowEntity> findByTmdbId(Integer tmdbId);
}
package br.ufpb.motus.services.show;

import br.ufpb.motus.model.show.EpisodeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EpisodeRepository extends JpaRepository<EpisodeEntity, String> {
    List<EpisodeEntity> findByShowIdOrderBySeasonNumberAscEpisodeNumberAsc(String showId);

    Optional<EpisodeEntity> findByShowIdAndSeasonNumberAndEpisodeNumber(String showId, int seasonNumber, int episodeNumber);

    long countByShowId(String showId);

    void deleteByShowId(String showId);
}
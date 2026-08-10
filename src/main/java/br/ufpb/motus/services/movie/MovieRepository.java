package br.ufpb.motus.services.movie;

import br.ufpb.motus.model.movie.MovieEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface MovieRepository extends JpaRepository<MovieEntity, String>, JpaSpecificationExecutor<MovieEntity> {
}

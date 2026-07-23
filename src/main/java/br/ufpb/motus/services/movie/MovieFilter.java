package br.ufpb.motus.services.movie;

import br.ufpb.motus.model.movie.MovieEntity;
import br.ufpb.motus.model.query.SearchQuery;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public class MovieFilter {
    public Specification<MovieEntity> filter(SearchQuery query){
        Specification<MovieEntity> spec = Specification.unrestricted();

        if (query.year() != null) {
            spec = spec.and(byYear(query.year()));
        }

        if (query.director() != null){
            spec = spec.and(byDirector(query.director()));
        }

        return spec;
    }

    private Specification<MovieEntity> byYear(Integer year) {
        return (root, criteriaQuery, cb) -> {
            LocalDate start = LocalDate.of(year, 1, 1);
            LocalDate end = LocalDate.of(year, 12, 31);
            return cb.between(root.get("releaseDate"), start, end);
        };
    }

    private Specification<MovieEntity> byDirector(String director) {
        return (root, criteriaQuery, cb) -> {
            var directorColumn = cb.lower(root.get("director"));// Pega a coluna director e converte para minúsculo
            var searchTerm = director.toLowerCase();            // Pega o texto do usuário e deixa minúsculo  
            var pattern = "%" + searchTerm + "%";               // Monta padrão de busca
            return cb.like(directorColumn, pattern);
        };
    }
}

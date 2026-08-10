package br.ufpb.motus.services.movie;

import br.ufpb.motus.model.movie.MovieEntity;
import br.ufpb.motus.model.query.SearchQuery;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

/**
 * constructs dynamic database queries for movie metadata based on search parameters.
 */
final class MovieFilter {

    @NonNull Specification<MovieEntity> filter(@NonNull SearchQuery query) {
        Specification<MovieEntity> spec = Specification.unrestricted();

        if (query.genre() != null) {
            spec = spec.and(byGenre(query.genre()));
        }
        if (query.year() != null) {
            spec = spec.and(byYear(query.year()));
        }
        if (query.director() != null) {
            spec = spec.and(byDirector(query.director()));
        }
        if (query.minRating() != null) {
            spec = spec.and(byRating(query.minRating()));
        }

        return spec;
    }

    private @NonNull Specification<MovieEntity> byGenre(@NonNull String genre) {
        return (root, criteriaQuery, cb) -> {
            var genresColumn = root.get("genres");
            var exists = cb.function("jsonb_exists", Boolean.class, genresColumn, cb.literal(genre));
            return cb.isTrue(exists);
        };
    }

    private @NonNull Specification<MovieEntity> byYear(@NonNull Integer year) {
        return (root, criteriaQuery, cb) -> {
            LocalDate start = LocalDate.of(year, 1, 1);
            LocalDate end = LocalDate.of(year, 12, 31);
            return cb.between(root.get("releaseDate"), start, end);
        };
    }

    private @NonNull Specification<MovieEntity> byDirector(@NonNull String director) {
        return (root, criteriaQuery, cb) -> {
            var directorColumn = cb.lower(root.get("director"));
            var pattern = "%" + director.toLowerCase() + "%";
            return cb.like(directorColumn, pattern);
        };
    }

    private @NonNull Specification<MovieEntity> byRating(double star) {
        return (root, criteriaQuery, cb) -> cb.greaterThanOrEqualTo(root.get("rating"), star);
    }
}
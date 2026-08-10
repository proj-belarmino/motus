package br.ufpb.motus.services.movie;

import br.ufpb.motus.model.exception.ResourceNotFoundException;
import br.ufpb.motus.model.movie.Movie;
import br.ufpb.motus.model.movie.MovieEntity;
import br.ufpb.motus.model.query.SearchQuery;
import br.ufpb.motus.services.fs.FileManager;
import br.ufpb.motus.services.fs.LibrarySyncService;
import br.ufpb.motus.services.log.Logger;
import br.ufpb.motus.services.tasks.TaskScheduler;
import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * primary domain service managing media catalog state.
 */
@Service
public class MovieService {

    private final MovieRepository repository;
    private final LibrarySyncService syncService;

    public MovieService(MovieRepository repository, LibrarySyncService syncService) {
        this.repository = repository;
        this.syncService = syncService;
    }

    /**
     * searches for movies matching the provided dynamic query parameters.
     *
     * @param query pagination and filtering constraints
     * @return a page of immutable movie projections
     */
    @Transactional(readOnly = true)
    public Page<Movie> searchMovies(@NonNull SearchQuery query) {
        MovieFilter filter = new MovieFilter();
        Specification<MovieEntity> spec = filter.filter(query);

        Sort.Direction direction = Sort.Direction.fromString(query.sortOrder() != null ? query.sortOrder() : "ASC");
        String sortBy = query.sortBy() != null ? query.sortBy() : "title";

        Pageable pageable = PageRequest.of(query.page(), query.size(), Sort.by(direction, sortBy));

        return repository.findAll(spec, pageable).map(Movie::fromEntity);
    }

    /**
     * completely removes a movie and its physical associated files from the system.
     * physical deletion is deferred until the database transaction successfully commits.
     *
     * @param id the unique identifier of the movie to remove
     * @throws ResourceNotFoundException if the identifier does not correspond to an existing movie
     */
    @Transactional
    public void deleteMovie(@NonNull String id) {
        MovieEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", id));

        repository.delete(entity);
        Logger.info("deleted movie record from database: %s", entity.getTitle());

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deletePhysicalFileSafely(entity.getFilePath());
                if (entity.getCoverPath() != null) {
                    deletePhysicalFileSafely(entity.getCoverPath());
                }
            }
        });
    }

    /**
     * asynchronously triggers a complete filesystem parity scan.
     */
    public void triggerBackgroundScan() {
        TaskScheduler.submit(syncService::scanLibrary).queue();
    }

    private void deletePhysicalFileSafely(String absolutePath) {
        if (absolutePath == null || absolutePath.isBlank()) {
            return;
        }

        Path path = Paths.get(absolutePath);
        if (FileManager.exists(path)) {
            try {
                FileManager.delete(path);
                Logger.trace("deleted physical file: %s", absolutePath);
            } catch (Exception error) {
                Logger.warn("failed to delete physical file %s: %s", absolutePath, error.getMessage());
            }
        }
    }
}
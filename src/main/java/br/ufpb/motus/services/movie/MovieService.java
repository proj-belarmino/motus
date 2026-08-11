package br.ufpb.motus.services.movie;

import br.ufpb.motus.model.exception.ResourceNotFoundException;
import br.ufpb.motus.model.movie.Movie;
import br.ufpb.motus.model.movie.MovieEntity;
import br.ufpb.motus.model.query.SearchQuery;
import br.ufpb.motus.model.movie.ExternalMovieInfo;
import br.ufpb.motus.model.movie.MediaMetadata;
import br.ufpb.motus.services.fs.FileManager;
import br.ufpb.motus.services.fs.LibrarySyncService;
import br.ufpb.motus.services.log.Logger;
import br.ufpb.motus.services.media.MediaProbeService;
import br.ufpb.motus.services.tasks.TaskScheduler;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * primary domain service managing media catalog state.
 */
@Service
public class MovieService {

    private final MovieRepository repository;
    private final LibrarySyncService syncService;
    private final MediaProbeService probeService;
    private final MovieMetadataService metadataService;
    private final String libraryPath;
    private final String thumbnailsPath;

    public MovieService(MovieRepository repository,
                        LibrarySyncService syncService,
                        MediaProbeService probeService,
                        MovieMetadataService metadataService,
                        @Value("${motus.fs.library.path:./media}") String libraryPath,
                        @Value("${motus.fs.thumbnails.path:./thumbnails}") String thumbnailsPath) {
        this.repository = repository;
        this.syncService = syncService;
        this.probeService = probeService;
        this.metadataService = metadataService;
        this.libraryPath = libraryPath;
        this.thumbnailsPath = thumbnailsPath;
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

    @Transactional
    public Movie updateTitle(@NonNull String id, @NonNull String newTitle) {
        MovieEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", id));
        entity.setTitle(newTitle);
        repository.save(entity);
        return Movie.fromEntity(entity);
    }

    @Transactional
    public Movie refreshMovie(@NonNull String id) {
        MovieEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", id));

        Path filePath = Paths.get(entity.getFilePath());
        if (!Files.exists(filePath)) {
            throw new ResourceNotFoundException("File", filePath.toString());
        }

        MediaMetadata mediaMetadata = probeService.probeFile(filePath);

        int thumbTimestamp = 0;
        if (mediaMetadata.durationSeconds() > 10) {
            thumbTimestamp = (int) (Math.random() * (mediaMetadata.durationSeconds() * 0.8) + (mediaMetadata.durationSeconds() * 0.1));
        } else if (mediaMetadata.durationSeconds() > 1) {
            thumbTimestamp = 1;
        }

        Path thumbnailPath = probeService.generateThumbnail(filePath, Paths.get(thumbnailsPath), String.valueOf(thumbTimestamp));
        String localCoverStr = thumbnailPath != null ? thumbnailPath.toAbsolutePath().toString() : null;

        ExternalMovieInfo tmdbInfo = metadataService.fetchByTitle(entity.getTitle()).orElse(null);

        if (tmdbInfo != null) {
            entity.setOriginalTitle(tmdbInfo.originalTitle());
            entity.setDirector(tmdbInfo.director());
            entity.setReleaseDate(tmdbInfo.releaseDate());
            entity.setGenres(tmdbInfo.genres());
            entity.setRating(tmdbInfo.rating());
            if (tmdbInfo.coverUrl() != null) {
                entity.setCoverPath(tmdbInfo.coverUrl());
            } else if (localCoverStr != null) {
                entity.setCoverPath(localCoverStr);
            }
        } else if (localCoverStr != null) {
            entity.setCoverPath(localCoverStr);
        }

        entity.setMetadata(mediaMetadata);

        repository.save(entity);
        return Movie.fromEntity(entity);
    }

    /**
     * Handles file uploads. Saves the file to the library directory.
     * The FileSystemObserverService will natively detect the file creation and trigger indexing.
     */
    public void uploadMovie(@NonNull MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file.");
        }

        try {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isBlank()) {
                originalFilename = "uploaded_media_" + System.currentTimeMillis();
            }

            Path targetDirectory = Paths.get(libraryPath);
            if (!Files.exists(targetDirectory)) {
                Files.createDirectories(targetDirectory);
            }

            Path targetPath = targetDirectory.resolve(originalFilename);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            Logger.info("Successfully saved uploaded file: %s", targetPath.toAbsolutePath());
        } catch (Exception error) {
            Logger.error("Failed to save uploaded media file", error);
            throw new RuntimeException("Failed to upload file.", error);
        }
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
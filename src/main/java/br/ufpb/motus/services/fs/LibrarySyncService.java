package br.ufpb.motus.services.fs;

import br.ufpb.motus.model.fs.FsEvent;
import br.ufpb.motus.model.fs.MimeTypeResolver;
import br.ufpb.motus.model.movie.ExternalMovieInfo;
import br.ufpb.motus.model.movie.MediaMetadata;
import br.ufpb.motus.model.movie.MovieEntity;
import br.ufpb.motus.services.log.Logger;
import br.ufpb.motus.services.media.MediaProbeService;
import br.ufpb.motus.services.movie.MovieMetadataService;
import br.ufpb.motus.services.movie.MovieRepository;
import br.ufpb.motus.services.movie.TitleExtractor;
import br.ufpb.motus.services.tasks.TaskScheduler;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.stream.Stream;

@Service
public class LibrarySyncService {

    private final MovieRepository movieRepository;
    private final MediaProbeService probeService;
    private final MovieMetadataService metadataService;
    private final String libraryPath;
    private final String thumbnailsPath;

    public LibrarySyncService(
            MovieRepository movieRepository,
            MediaProbeService probeService,
            MovieMetadataService metadataService,
            @Value("${motus.fs.library.path:./media}") String libraryPath,
            @Value("${motus.fs.thumbnails.path:./thumbnails}") String thumbnailsPath) {
        this.movieRepository = movieRepository;
        this.probeService = probeService;
        this.metadataService = metadataService;
        this.libraryPath = libraryPath;
        this.thumbnailsPath = thumbnailsPath;
        ensureDirectories();
    }

    public void scanLibrary() {
        Logger.info("Starting full library scan at: %s", libraryPath);
        try (Stream<Path> paths = Files.walk(Paths.get(libraryPath))) {
            paths.filter(Files::isRegularFile)
                    .filter(this::isMediaFile)
                    .forEach(path -> TaskScheduler.submit(() -> processFileSafely(path)).queue());
        } catch (IOException error) {
            Logger.error("Failed to traverse library directory during scan.", error);
        }
    }

    @EventListener
    @Transactional
    public void handleFileSystemEvent(@NonNull FsEvent event) {
        Path path = Paths.get(event.path());
        switch (event.type()) {
            case CREATED -> {
                if (isMediaFile(path)) TaskScheduler.submit(() -> processFileSafely(path)).queue();
            }
            case DELETED -> removeFileRecord(path);
            case RENAMED -> {
                if (event.oldPath() != null) removeFileRecord(Paths.get(event.oldPath()));
                if (isMediaFile(path)) TaskScheduler.submit(() -> processFileSafely(path)).queue();
            }
            case MODIFIED -> {
                if (isMediaFile(path)) TaskScheduler.submit(() -> processFileSafely(path)).queue();
            }
        }
    }

    private void processFileSafely(@NonNull Path filePath) {
        try {
            String pathString = filePath.toAbsolutePath().toString();
            if (movieRepository.existsByFilePath(pathString)) return;

            MediaMetadata mediaMetadata = probeService.probeFile(filePath);

            int thumbTimestamp = 0;
            if (mediaMetadata.durationSeconds() > 5) {
                thumbTimestamp = 5;
            } else if (mediaMetadata.durationSeconds() > 1) {
                thumbTimestamp = 1;
            }

            Path thumbnailPath = probeService.generateThumbnail(filePath, Paths.get(thumbnailsPath), String.valueOf(thumbTimestamp));

            String filename = filePath.getFileName().toString();
            String cleanTitle = TitleExtractor.extractTitle(filename);

            ExternalMovieInfo tmdbInfo = metadataService.fetchByTitle(cleanTitle).orElse(null);

            MovieEntity entity = createEntity(filePath, mediaMetadata, thumbnailPath, cleanTitle, tmdbInfo);
            movieRepository.save(entity);
            Logger.info("Successfully indexed: %s", entity.getTitle());
        } catch (Exception error) {
            Logger.error("Failed to process file: %s", error, filePath);
        }
    }

    private void removeFileRecord(@NonNull Path filePath) {
        String pathString = filePath.toAbsolutePath().toString();
        movieRepository.findByFilePath(pathString).ifPresent(movie -> {
            movieRepository.delete(movie);
            Logger.info("Removed missing file from index: %s", pathString);
        });
    }

    private @NonNull MovieEntity createEntity(
            @NonNull Path filePath,
            @NonNull MediaMetadata mediaMetadata,
            @Nullable Path thumbnailPath,
            @NonNull String fallbackTitle,
            @Nullable ExternalMovieInfo info) {

        String localCoverStr = thumbnailPath != null ? thumbnailPath.toAbsolutePath().toString() : null;

        if (info != null) {
            MovieEntity entity = metadataService.toEntity(filePath, info);
            entity.setMetadata(mediaMetadata);
            if (entity.getCoverPath() == null && localCoverStr != null) {
                entity.setCoverPath(localCoverStr);
            }
            return entity;
        }

        return new MovieEntity(
                UUID.randomUUID().toString(),
                fallbackTitle, fallbackTitle,
                filePath.toAbsolutePath().toString(),
                null, null,
                java.util.Collections.emptyList(), 0.0,
                localCoverStr,
                FileManager.calculateSha256(filePath),
                mediaMetadata,
                java.util.Collections.emptyList()
        );
    }

    private boolean isMediaFile(@NonNull Path path) {
        String mimeType = MimeTypeResolver.resolve(path);
        return mimeType.startsWith("video/") || mimeType.startsWith("audio/");
    }

    private void ensureDirectories() {
        try {
            Files.createDirectories(Paths.get(libraryPath));
            Files.createDirectories(Paths.get(thumbnailsPath));
        } catch (IOException error) {
            throw new RuntimeException("Failed to initialise library directories.", error);
        }
    }
}
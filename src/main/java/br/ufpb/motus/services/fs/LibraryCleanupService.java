package br.ufpb.motus.services.fs;

import br.ufpb.motus.services.log.Logger;
import br.ufpb.motus.services.movie.MovieRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.stream.Stream;

/**
 * background worker responsible for reclaiming local storage by removing orphaned cache files.
 */
@Service
@EnableScheduling
public class LibraryCleanupService {

    private final MovieRepository movieRepository;
    private final String thumbnailsPath;

    public LibraryCleanupService(
            MovieRepository movieRepository,
            @Value("${motus.fs.thumbnails.path:./thumbnails}") String thumbnailsPath) {
        this.movieRepository = movieRepository;
        this.thumbnailsPath = thumbnailsPath;
    }

    /**
     * scheduled job that runs every 24 hours to delete orphaned thumbnails.
     * reclaims storage space from media that was deleted or re-indexed.
     */
    @Scheduled(fixedRate = 86400000) // 24 hours in ms
    public void cleanupOrphanThumbnails() {
        Logger.info("Starting scheduled cleanup of orphaned thumbnails...");

        Set<String> validCoverPaths = movieRepository.findAllCoverPaths();
        int deletedCount = 0;

        try (Stream<Path> paths = Files.walk(Paths.get(thumbnailsPath))) {
            deletedCount = paths
                    .filter(Files::isRegularFile)
                    .mapToInt(path -> safelyDeleteIfOrphan(path, validCoverPaths))
                    .sum();

        } catch (IOException error) {
            Logger.error("Failed to traverse thumbnails directory during cleanup.", error);
        }

        Logger.info("Cleanup complete. Removed %d orphaned thumbnails.", deletedCount);
    }

    private int safelyDeleteIfOrphan(Path path, Set<String> validCoverPaths) {
        String pathString = path.toAbsolutePath().toString();

        if (!validCoverPaths.contains(pathString)) {
            try {
                Files.deleteIfExists(path);
                Logger.trace("Deleted orphaned thumbnail: %s", pathString);
                return 1;
            } catch (IOException error) {
                Logger.warn("Failed to delete orphaned thumbnail: %s", pathString);
            }
        }
        return 0;
    }
}
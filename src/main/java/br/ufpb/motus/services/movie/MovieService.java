package br.ufpb.motus.services.movie;

import br.ufpb.motus.model.exception.ResourceNotFoundException;
import br.ufpb.motus.model.movie.Movie;
import br.ufpb.motus.model.movie.MovieEntity;
import br.ufpb.motus.model.movie.Subtitle;
import br.ufpb.motus.model.query.SearchQuery;
import br.ufpb.motus.model.movie.ExternalMovieInfo;
import br.ufpb.motus.model.movie.MediaMetadata;
import br.ufpb.motus.services.fs.FileManager;
import br.ufpb.motus.services.fs.LibrarySyncService;
import br.ufpb.motus.services.log.Logger;
import br.ufpb.motus.services.media.MediaProbeService;
import br.ufpb.motus.services.tasks.TaskScheduler;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
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

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
    private final String subtitlesPath;

    public MovieService(MovieRepository repository,
                        LibrarySyncService syncService,
                        MediaProbeService probeService,
                        MovieMetadataService metadataService,
                        @Value("${motus.fs.library.path:./media}") String libraryPath,
                        @Value("${motus.fs.thumbnails.path:./thumbnails}") String thumbnailsPath,
                        @Value("${motus.fs.subtitles.path:./subtitles}") String subtitlesPath) {
        this.repository = repository;
        this.syncService = syncService;
        this.probeService = probeService;
        this.metadataService = metadataService;
        this.libraryPath = libraryPath;
        this.thumbnailsPath = thumbnailsPath;
        this.subtitlesPath = subtitlesPath;
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
                if (entity.getSubtitles() != null) {
                    entity.getSubtitles().forEach(subtitle -> deletePhysicalFileSafely(subtitle.filePath()));
                }
            }
        });
    }

    /**
     * fetches a single movie by its identifier.
     *
     * @param id the unique identifier of the movie
     * @return the immutable movie projection
     * @throws ResourceNotFoundException if no movie matches the identifier
     */
    @Transactional(readOnly = true)
    public Movie getMovie(@NonNull String id) {
        MovieEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", id));
        return Movie.fromEntity(entity);
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

    /**
     * stores an uploaded subtitle file and attaches it to the given movie.
     * srt files are transparently converted to webvtt for browser playback.
     *
     * @param movieId the identifier of the movie to attach the subtitle to
     * @param file the uploaded subtitle file
     * @param language optional language override; inferred from the filename when absent
     * @return the updated movie projection
     */
    @Transactional
    public Movie uploadSubtitle(@NonNull String movieId, @NonNull MultipartFile file, @Nullable String language) {
        MovieEntity entity = repository.findById(movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", movieId));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty subtitle file.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "subtitle.srt";
        }

        String lower = originalFilename.toLowerCase();
        if (!lower.endsWith(".srt") && !lower.endsWith(".vtt")) {
            throw new IllegalArgumentException("Subtitle files must be .srt or .vtt.");
        }

        try {
            String code = (language != null && !language.isBlank())
                    ? language.trim().toLowerCase()
                    : inferLanguage(originalFilename);
            String label = LANGUAGE_CODES.getOrDefault(code, code);
            String subtitleId = UUID.randomUUID().toString();
            String webVtt = toWebVtt(file.getBytes());

            Path targetDirectory = Paths.get(subtitlesPath);
            Files.createDirectories(targetDirectory);
            Path targetPath = targetDirectory.resolve(subtitleId + ".vtt");
            FileManager.write(targetPath, webVtt);

            List<Subtitle> subtitles = new ArrayList<>(
                    entity.getSubtitles() != null ? entity.getSubtitles() : List.of()
            );
            subtitles.add(new Subtitle(subtitleId, code, label, targetPath.toAbsolutePath().toString()));
            entity.setSubtitles(subtitles);
            repository.save(entity);

            Logger.info("attached subtitle '%s' (%s) to %s", label, code, entity.getTitle());
            return Movie.fromEntity(entity);
        } catch (IOException error) {
            Logger.error("failed to save subtitle file", error);
            throw new RuntimeException("Failed to upload subtitle.", error);
        }
    }

    /**
     * detaches a subtitle from a movie and deletes its physical file after commit.
     *
     * @param movieId the identifier of the owning movie
     * @param subtitleId the identifier of the subtitle to remove
     * @return the updated movie projection
     * @throws ResourceNotFoundException if the movie or subtitle does not exist
     */
    @Transactional
    public Movie deleteSubtitle(@NonNull String movieId, @NonNull String subtitleId) {
        MovieEntity entity = repository.findById(movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", movieId));

        List<Subtitle> subtitles = entity.getSubtitles() != null ? new ArrayList<>(entity.getSubtitles()) : new ArrayList<>();
        Subtitle subtitle = subtitles.stream()
                .filter(candidate -> candidate.id().equals(subtitleId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Subtitle", subtitleId));

        subtitles.remove(subtitle);
        entity.setSubtitles(subtitles);
        repository.save(entity);

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deletePhysicalFileSafely(subtitle.filePath());
            }
        });

        Logger.info("removed subtitle '%s' from %s", subtitle.label(), entity.getTitle());
        return Movie.fromEntity(entity);
    }

    private static final Map<String, String> LANGUAGE_CODES = Map.ofEntries(
            Map.entry("en", "English"),
            Map.entry("pt", "Portuguese"),
            Map.entry("pt-br", "Portuguese (Brazil)"),
            Map.entry("pt-pt", "Portuguese (Portugal)"),
            Map.entry("es", "Spanish"),
            Map.entry("fr", "French"),
            Map.entry("de", "German"),
            Map.entry("it", "Italian"),
            Map.entry("ja", "Japanese"),
            Map.entry("ko", "Korean"),
            Map.entry("zh", "Chinese"),
            Map.entry("ru", "Russian"),
            Map.entry("ar", "Arabic"),
            Map.entry("hi", "Hindi"),
            Map.entry("nl", "Dutch"),
            Map.entry("sv", "Swedish"),
            Map.entry("no", "Norwegian"),
            Map.entry("da", "Danish"),
            Map.entry("pl", "Polish"),
            Map.entry("tr", "Turkish"),
            Map.entry("el", "Greek"),
            Map.entry("he", "Hebrew"),
            Map.entry("th", "Thai"),
            Map.entry("vi", "Vietnamese"),
            Map.entry("id", "Indonesian")
    );

    private @NonNull String inferLanguage(@NonNull String filename) {
        String base = filename.toLowerCase();
        int lastDot = base.lastIndexOf('.');
        if (lastDot > 0) {
            base = base.substring(0, lastDot);
        }

        String[] tokens = base.split("[._\\-\\s]+");
        for (String token : tokens) {
            if (LANGUAGE_CODES.containsKey(token)) {
                return token;
            }
            if ("eng".equals(token)) return "en";
            if ("por".equals(token)) return "pt";
            if ("spa".equals(token)) return "es";
            if ("fra".equals(token)) return "fr";
            if ("deu".equals(token)) return "de";
            if ("ita".equals(token)) return "it";
            if ("jpn".equals(token)) return "ja";
            if ("kor".equals(token)) return "ko";
            if ("zho".equals(token)) return "zh";
            if ("rus".equals(token)) return "ru";
            if ("ara".equals(token)) return "ar";
            if ("hin".equals(token)) return "hi";
            if ("english".equals(token)) return "en";
            if ("portuguese".equals(token) || "portugues".equals(token) || "brazilian".equals(token)) return "pt-br";
            if ("spanish".equals(token) || "espanol".equals(token)) return "es";
            if ("french".equals(token)) return "fr";
            if ("german".equals(token)) return "de";
            if ("italian".equals(token)) return "it";
            if ("japanese".equals(token)) return "ja";
            if ("korean".equals(token)) return "ko";
            if ("chinese".equals(token) || "mandarin".equals(token)) return "zh";
            if ("russian".equals(token)) return "ru";
            if ("arabic".equals(token)) return "ar";
            if ("hindi".equals(token)) return "hi";
        }
        return "en";
    }

    /**
     * normalizes subtitle content to webvtt, converting srt timestamps and line endings.
     */
    private @NonNull String toWebVtt(@NonNull byte[] bytes) {
        String content = new String(bytes, StandardCharsets.UTF_8);
        if (content.startsWith("\uFEFF")) {
            content = content.substring(1);
        }
        content = content.replace("\r\n", "\n").replace('\r', '\n');
        if (content.startsWith("WEBVTT")) {
            return content;
        }

        StringBuilder vtt = new StringBuilder("WEBVTT\n\n");
        for (String line : content.split("\n")) {
            if (line.contains("-->")) {
                line = line.replace(',', '.');
            }
            vtt.append(line).append('\n');
        }
        return vtt.toString();
    }
}
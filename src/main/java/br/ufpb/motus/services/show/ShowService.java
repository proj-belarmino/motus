package br.ufpb.motus.services.show;

import br.ufpb.motus.model.exception.ResourceNotFoundException;
import br.ufpb.motus.model.movie.MediaMetadata;
import br.ufpb.motus.model.show.Episode;
import br.ufpb.motus.model.show.EpisodeEntity;
import br.ufpb.motus.model.show.Show;
import br.ufpb.motus.model.show.ShowEntity;
import br.ufpb.motus.model.show.ShowSearchResult;
import br.ufpb.motus.model.show.TmdbTvDetails;
import br.ufpb.motus.services.fs.FileManager;
import br.ufpb.motus.services.log.Logger;
import br.ufpb.motus.services.media.MediaProbeService;
import br.ufpb.motus.services.movie.TitleExtractor;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * aggregates individual episode files around a single show and enriches each title
 * with dynamically fetched metadata. episode files are stored outside the movie
 * library so the filesystem indexer never treats them as standalone movies.
 */
@Service
public class ShowService {

    private static final Pattern EXTENSION_PATTERN = Pattern.compile("[.][^.]+$");
    private static final Pattern SEASON_EPISODE_PATTERN = Pattern.compile("(?i).*[s](\\d{1,2})[e](\\d{1,3}).*");
    private static final Pattern SEASON_EPISODE_X_PATTERN = Pattern.compile("(?i).*(\\d{1,2})[x](\\d{1,3}).*");

    private final ShowRepository showRepository;
    private final EpisodeRepository episodeRepository;
    private final MediaProbeService probeService;
    private final ShowMetadataService metadataService;
    private final String showsPath;
    private final String thumbnailsPath;

    public ShowService(
            ShowRepository showRepository,
            EpisodeRepository episodeRepository,
            MediaProbeService probeService,
            ShowMetadataService metadataService,
            @Value("${motus.fs.shows.path:./shows}") String showsPath,
            @Value("${motus.fs.thumbnails.path:./thumbnails}") String thumbnailsPath) {
        this.showRepository = showRepository;
        this.episodeRepository = episodeRepository;
        this.probeService = probeService;
        this.metadataService = metadataService;
        this.showsPath = showsPath;
        this.thumbnailsPath = thumbnailsPath;
    }

    public @NonNull List<ShowSearchResult> searchShows(@NonNull String query) {
        return metadataService.searchShows(query);
    }

    /**
     * creates a show from TMDB metadata. when a tmdbId is missing, the title is
     * searched dynamically and the best matching show is used. a bare title without
     * any TMDB match still creates a minimal show so uploads are always possible.
     */
    @Transactional
    public @NonNull Show createShow(@Nullable String title, @Nullable Integer tmdbId) {
        TmdbTvDetails details = null;
        Integer resolvedTmdbId = tmdbId;

        if (resolvedTmdbId == null && title != null && !title.isBlank()) {
            List<ShowSearchResult> results = metadataService.searchShows(title);
            if (!results.isEmpty()) {
                resolvedTmdbId = results.getFirst().tmdbId();
            }
        }

        if (resolvedTmdbId != null) {
            details = metadataService.fetchTvDetails(resolvedTmdbId);
        }

        if (resolvedTmdbId != null) {
            ShowEntity existing = showRepository.findByTmdbId(resolvedTmdbId).orElse(null);
            if (existing != null) {
                return Show.fromEntity(existing, episodeRepository.findByShowIdOrderBySeasonNumberAscEpisodeNumberAsc(existing.getId()));
            }
        }

        ShowEntity entity = new ShowEntity();
        entity.setId(UUID.randomUUID().toString());
        entity.setTitle((title != null && !title.isBlank()) ? title : (details != null ? details.name() : "Untitled show"));
        entity.setCreatedAt(Instant.now());

        if (details != null) {
            entity.setOriginalTitle(details.originalName());
            entity.setOverview(details.overview());
            entity.setReleaseDate(parseDate(details.firstAirDate()));
            entity.setGenres(details.genres() != null
                    ? details.genres().stream().map(br.ufpb.motus.model.movie.TmdbGenre::name).toList()
                    : List.of());
            entity.setRating(details.voteAverage());
            entity.setCoverPath(metadataService.resolvePosterUrl(details.posterPath()));
            entity.setStatus(details.status());
            entity.setNumberOfSeasons(details.numberOfSeasons());
            entity.setTmdbId(details.id());
        }

        showRepository.save(entity);
        Logger.info("created show: %s", entity.getTitle());
        return Show.fromEntity(entity, List.of());
    }

    @Transactional(readOnly = true)
    public @NonNull List<Show> getShows() {
        return showRepository.findAllByOrderByTitleAsc().stream()
                .map(entity -> Show.fromEntity(entity, episodeRepository.findByShowIdOrderBySeasonNumberAscEpisodeNumberAsc(entity.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public @NonNull Show getShow(@NonNull String id) {
        ShowEntity entity = showRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Show", id));
        return Show.fromEntity(entity, episodeRepository.findByShowIdOrderBySeasonNumberAscEpisodeNumberAsc(id));
    }

    @Transactional
    public void deleteShow(@NonNull String id) {
        ShowEntity entity = showRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Show", id));

        List<EpisodeEntity> episodes = episodeRepository.findByShowIdOrderBySeasonNumberAscEpisodeNumberAsc(id);
        List<String> filePaths = episodes.stream().map(EpisodeEntity::getFilePath).toList();

        showRepository.delete(entity);

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                filePaths.forEach(ShowService.this::deletePhysicalFileSafely);
            }
        });

        Logger.info("deleted show: %s", entity.getTitle());
    }

    /**
     * uploads an episode file, probes its metadata, generates a thumbnail and
     * attaches it to the show under the given (or inferred) season/episode numbers.
     */
    @Transactional
    public @NonNull Show uploadEpisode(@NonNull String showId, @NonNull MultipartFile file, @Nullable Integer season, @Nullable Integer episode) {
        ShowEntity show = showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show", showId));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file.");
        }

        String originalFilename = sanitizeFilename(file.getOriginalFilename());
        int seasonNumber = season != null ? season : inferSeason(originalFilename);
        int episodeNumber = episode != null ? episode : inferEpisode(originalFilename);

        try {
            Path targetDirectory = Paths.get(showsPath).resolve(showId).toAbsolutePath().normalize();
            Files.createDirectories(targetDirectory);
            Path targetPath = targetDirectory.resolve(originalFilename);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            MediaMetadata mediaMetadata = probeService.probeFile(targetPath);

            int thumbTimestamp = 0;
            if (mediaMetadata.durationSeconds() > 5) {
                thumbTimestamp = 5;
            } else if (mediaMetadata.durationSeconds() > 1) {
                thumbTimestamp = 1;
            }

            Path thumbnailDir = Paths.get(thumbnailsPath).resolve(showId).toAbsolutePath().normalize();
            Files.createDirectories(thumbnailDir);
            Path thumbnailPath = probeService.generateThumbnail(targetPath, thumbnailDir, String.valueOf(thumbTimestamp));

            EpisodeEntity entity = episodeRepository
                    .findByShowIdAndSeasonNumberAndEpisodeNumber(showId, seasonNumber, episodeNumber)
                    .orElseGet(EpisodeEntity::new);

            String oldFilePath = entity.getId() != null ? entity.getFilePath() : null;
            String oldCoverPath = entity.getId() != null ? entity.getCoverPath() : null;

            entity.setId(entity.getId() != null ? entity.getId() : UUID.randomUUID().toString());
            entity.setShowId(showId);
            entity.setSeasonNumber(seasonNumber);
            entity.setEpisodeNumber(episodeNumber);
            entity.setTitle(extractEpisodeTitle(originalFilename));
            entity.setFilePath(targetPath.toString());
            entity.setFileHash(FileManager.calculateSha256(targetPath));
            entity.setCoverPath(thumbnailPath != null ? thumbnailPath.toAbsolutePath().toString() : null);
            entity.setMetadata(mediaMetadata);
            if (entity.getCreatedAt() == null) {
                entity.setCreatedAt(Instant.now());
            }

            episodeRepository.save(entity);

            if (oldFilePath != null && !oldFilePath.equals(targetPath.toString())) {
                String finalOldFile = oldFilePath;
                String finalOldCover = oldCoverPath;
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        deletePhysicalFileSafely(finalOldFile);
                        if (finalOldCover != null) deletePhysicalFileSafely(finalOldCover);
                    }
                });
            }

            Logger.info("uploaded %s S%02dE%02d to %s", show.getTitle(), seasonNumber, episodeNumber);
            return getShow(showId);
        } catch (IOException error) {
            Logger.error("failed to upload episode", error);
            throw new RuntimeException("Failed to upload episode.", error);
        }
    }

    @Transactional
    public @NonNull Show deleteEpisode(@NonNull String showId, @NonNull String episodeId) {
        EpisodeEntity entity = episodeRepository.findById(episodeId)
                .filter(candidate -> candidate.getShowId().equals(showId))
                .orElseThrow(() -> new ResourceNotFoundException("Episode", episodeId));

        String filePath = entity.getFilePath();
        String coverPath = entity.getCoverPath();

        episodeRepository.delete(entity);

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deletePhysicalFileSafely(filePath);
                if (coverPath != null) deletePhysicalFileSafely(coverPath);
            }
        });

        Logger.info("removed S%02dE%02d from %s", entity.getSeasonNumber(), entity.getEpisodeNumber(), showId);
        return getShow(showId);
    }

    public @NonNull Episode entityToDto(@NonNull EpisodeEntity entity) {
        return Episode.fromEntity(entity);
    }

    @Transactional(readOnly = true)
    public @NonNull Episode getEpisode(@NonNull String episodeId) {
        EpisodeEntity entity = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Episode", episodeId));
        return Episode.fromEntity(entity);
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "episode_" + System.currentTimeMillis() + ".mp4";
        }
        String name = Paths.get(filename).getFileName().toString();
        name = name.replaceAll("[\\\\/]", "_");
        if (name.isBlank()) {
            name = "episode_" + System.currentTimeMillis() + ".mp4";
        }
        return name;
    }

    private int inferSeason(String filename) {
        Matcher matcher = SEASON_EPISODE_PATTERN.matcher(filename);
        if (matcher.matches()) return Integer.parseInt(matcher.group(1));
        Matcher xMatcher = SEASON_EPISODE_X_PATTERN.matcher(filename);
        return xMatcher.matches() ? Integer.parseInt(xMatcher.group(1)) : 1;
    }

    private int inferEpisode(String filename) {
        Matcher matcher = SEASON_EPISODE_PATTERN.matcher(filename);
        if (matcher.matches()) return Integer.parseInt(matcher.group(2));
        Matcher xMatcher = SEASON_EPISODE_X_PATTERN.matcher(filename);
        return xMatcher.matches() ? Integer.parseInt(xMatcher.group(2)) : 1;
    }

    private String extractEpisodeTitle(String filename) {
        String base = EXTENSION_PATTERN.matcher(filename).replaceFirst("");
        base = base.replaceAll("(?i)\\b(s\\d{1,2}e\\d{1,3}|\\d{1,2}x\\d{1,3})\\b", " ");
        String title = TitleExtractor.extractTitle(base);
        return title.isBlank() ? filename : title;
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            String[] parts = value.split("-");
            int year = Integer.parseInt(parts[0]);
            int month = parts.length > 1 ? Integer.parseInt(parts[1]) : 1;
            int day = parts.length > 2 ? Integer.parseInt(parts[2]) : 1;
            return LocalDate.of(year, month, day);
        } catch (NumberFormatException error) {
            return null;
        }
    }

    private void deletePhysicalFileSafely(String absolutePath) {
        if (absolutePath == null || absolutePath.isBlank()) return;
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
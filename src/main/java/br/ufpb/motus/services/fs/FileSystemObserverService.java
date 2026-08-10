package br.ufpb.motus.services.fs;

import br.ufpb.motus.model.fs.FsEvent;
import br.ufpb.motus.services.log.Logger;
import br.ufpb.motus.services.tasks.TaskScheduler;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.jetbrains.annotations.Contract;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.ClosedWatchServiceException;
import java.nio.file.FileSystems;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.WatchEvent;
import java.nio.file.WatchKey;
import java.nio.file.WatchService;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static java.nio.file.StandardWatchEventKinds.ENTRY_CREATE;
import static java.nio.file.StandardWatchEventKinds.ENTRY_DELETE;
import static java.nio.file.StandardWatchEventKinds.ENTRY_MODIFY;
import static java.nio.file.StandardWatchEventKinds.OVERFLOW;

/**
 * natively observes the file system for changes using java.nio.file.WatchService.
 * publishes domain events for processing by the library synchronisation service.
 * registers dynamically created directories on the fly.
 */
@Service
public class FileSystemObserverService {

    private final ApplicationEventPublisher eventPublisher;
    private final Path targetDirectory;
    private final Map<WatchKey, Path> watchKeys = new ConcurrentHashMap<>();

    private WatchService watcher;
    private volatile boolean isRunning = false;

    public FileSystemObserverService(
            ApplicationEventPublisher eventPublisher,
            @Value("${motus.fs.library.path:./media}") String targetDirectory) {
        this.eventPublisher = eventPublisher;
        this.targetDirectory = Paths.get(targetDirectory);
    }

    @PostConstruct
    public void startObserver() {
        Logger.info("Starting native Java file system observer on: %s", targetDirectory);
        try {
            ensureDirectoryExists(targetDirectory);
            this.watcher = FileSystems.getDefault().newWatchService();
            registerAll(targetDirectory);
            this.isRunning = true;

            // Submit loop to Virtual Threads.
            // watcher.take() is a blocking I/O operation and MUST NOT block a core platform thread (.cpuBound()).
            TaskScheduler.submit(this::processEvents)
                    .onFailure(error -> {
                        if (isRunning) {
                            Logger.error("File system observer failed unexpectedly.", error);
                        }
                    })
                    .queue();
        } catch (IOException error) {
            Logger.error("Failed to initialise file system watcher.", error);
        }
    }

    @PreDestroy
    public void stopObserver() {
        this.isRunning = false;
        try {
            if (watcher != null) {
                watcher.close();
            }
        } catch (IOException error) {
            Logger.error("Error closing file system watcher.", error);
        }
    }

    private void registerAll(@NonNull Path start) throws IOException {
        Files.walkFileTree(start, new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
                registerDirectory(dir);
                return FileVisitResult.CONTINUE;
            }
        });
    }

    private void registerDirectory(@NonNull Path dir) throws IOException {
        WatchKey key = dir.register(watcher, ENTRY_CREATE, ENTRY_DELETE, ENTRY_MODIFY);
        watchKeys.put(key, dir);
    }

    private void processEvents() {
        while (isRunning) {
            try {
                WatchKey key = watcher.take();
                Path dir = watchKeys.get(key);
                if (dir == null) {
                    Logger.warn("WatchKey not recognised in active map.");
                    continue;
                }

                for (WatchEvent<?> event : key.pollEvents()) {
                    WatchEvent.Kind<?> kind = event.kind();
                    if (kind == OVERFLOW) {
                        continue;
                    }

                    WatchEvent<Path> pathEvent = cast(event);
                    Path name = pathEvent.context();
                    Path child = dir.resolve(name);

                    if (kind == ENTRY_CREATE) {
                        try {
                            if (Files.isDirectory(child, LinkOption.NOFOLLOW_LINKS)) {
                                registerAll(child);
                            }
                        } catch (IOException error) {
                            Logger.warn("Failed to register dynamically created directory: %s", child.toString());
                        }
                    }

                    publishEvent(kind, child);
                }

                boolean valid = key.reset();
                if (!valid) {
                    watchKeys.remove(key);
                    if (watchKeys.isEmpty()) {
                        Logger.warn("All watch keys are invalid. Directory might have been completely removed.");
                    }
                }

            } catch (InterruptedException error) {
                Thread.currentThread().interrupt();
                break;
            } catch (ClosedWatchServiceException error) {
                break;
            }
        }
    }

    private void publishEvent(WatchEvent.Kind<?> kind, @NonNull Path child) {
        FsEvent.EventType type = mapEventType(kind);
        if (type != null) {
            FsEvent fsEvent = new FsEvent(type, child.toAbsolutePath().toString(), null);
            Logger.trace("File event emitted natively: [%s] %s", type.name(), fsEvent.path());
            eventPublisher.publishEvent(fsEvent);
        }
    }

    @Contract(pure = true)
    private FsEvent.@Nullable EventType mapEventType(WatchEvent.Kind<?> kind) {
        if (kind == ENTRY_CREATE) return FsEvent.EventType.CREATED;
        if (kind == ENTRY_MODIFY) return FsEvent.EventType.MODIFIED;
        if (kind == ENTRY_DELETE) return FsEvent.EventType.DELETED;
        return null;
    }

    private void ensureDirectoryExists(@NonNull Path path) throws IOException {
        if (!Files.exists(path)) {
            Files.createDirectories(path);
        }
    }

    @SuppressWarnings("unchecked")
    private static <T> WatchEvent<T> cast(WatchEvent<?> event) {
        return (WatchEvent<T>) event;
    }
}
package br.ufpb.motus.services.log;

import org.jetbrains.annotations.Contract;
import org.jspecify.annotations.NonNull;
import org.slf4j.helpers.MessageFormatter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public final class Logger {
    private static final Logger INSTANCE = new Logger();
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = getFormatter();

    private Path logFile;
    private LogLevel loggingThreshold = LogLevel.INFO;

    private Logger () {
        this.logFile = Path.of("application.log");
    }

    public static Logger getInstance() {
        return INSTANCE;
    }

    public synchronized void configure(Path logFile, LogLevel loggingThreshold) {
        if (logFile != null) {
            this.logFile = logFile;
        }
        if (loggingThreshold != null) {
            this.loggingThreshold = loggingThreshold;
        }
    }

    // One function per visibility level. Too lazy to comment individually!

    public static void trace(String message, Object ... args) {
        INSTANCE.write(LogLevel.TRACE, message, args);
    }

    public static void debug(String message, Object ... args) {
        INSTANCE.write(LogLevel.DEBUG, message, args);
    }

    public static void info(String message, Object ... args) {
        INSTANCE.write(LogLevel.INFO, message, args);
    }

    public static void warn(String message, Object ... args) {
        INSTANCE.write(LogLevel.WARN, message, args);
    }

    public static void error(String message, Object ... args) {
        INSTANCE.write(LogLevel.ERROR, message, args);
    }

    public static void error(String message, Throwable throwable, Object ... args) {
        String details = message;
        if (throwable != null) {
            var errorMessage = String.format("| Exception: %s - %s", throwable.getClass().getName(), throwable.getMessage());
            details += errorMessage;
        }
        INSTANCE.write(LogLevel.ERROR, message, args);
    }

    private void write(LogLevel level, String message, Object... args) {
        if (loggingThreshold.permits(level)) {
            String formattedMessage = formatMessage(message, args);
            String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
            String logLine = String.format("[%s] [%s] %s%n", timestamp, level, formattedMessage);

            if (level == LogLevel.ERROR || level == LogLevel.WARN) {
                System.err.println(logLine);
            } else {
                System.out.println(logLine);
            }

            appendToFile(logLine);
        }
    }

    private String formatMessage(String message, Object... args) {
        if (args != null && args.length > 0) {
            try {
                return String.format(message, args);
            } catch (Exception error) {
                return message;
            }
        }
        return message;
    }

    private synchronized void appendToFile(String logLine) {
        try {
            Path parent = logFile.getParent();
            if (parent != null && !Files.exists(parent)) {
                Files.createDirectories(parent);
            }
            Files.writeString(
                    logFile,
                    logLine,
                    StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.APPEND
            );
        } catch (IOException error) {
            System.err.println("[LOG ERROR] Failed to write log to file: " + error.getMessage());
        }
    }

    @Contract(" -> new")
    private static @NonNull DateTimeFormatter getFormatter() {
        return DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    }
}

package br.ufpb.motus.services.log;

import org.slf4j.LoggerFactory;

/**
 * lightweight facade mapping legacy logging calls to standard slf4j.
 * removes the severe performance penalty of synchronous file appending in the previous implementation.
 */
public final class Logger {
    private static final org.slf4j.Logger log = LoggerFactory.getLogger("Motus");

    private Logger() {}

    public static void trace(String message, Object... args) {
        if (log.isTraceEnabled()) {
            log.trace(formatMessage(message, args));
        }
    }

    public static void debug(String message, Object... args) {
        if (log.isDebugEnabled()) {
            log.debug(formatMessage(message, args));
        }
    }

    public static void info(String message, Object... args) {
        if (log.isInfoEnabled()) {
            log.info(formatMessage(message, args));
        }
    }

    public static void warn(String message, Object... args) {
        if (log.isWarnEnabled()) {
            log.warn(formatMessage(message, args));
        }
    }

    public static void error(String message, Object... args) {
        if (log.isErrorEnabled()) {
            log.error(formatMessage(message, args));
        }
    }

    public static void error(String message, Throwable throwable, Object... args) {
        if (log.isErrorEnabled()) {
            log.error(formatMessage(message, args), throwable);
        }
    }

    private static String formatMessage(String message, Object... args) {
        if (args != null && args.length > 0) {
            try {
                return String.format(message, args);
            } catch (Exception error) {
                return message; // fallback if formatting fails
            }
        }
        return message;
    }
}
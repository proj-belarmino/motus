package br.ufpb.motus.services.log;

public enum LogLevel {
    TRACE(0),
    DEBUG(1),
    INFO(2),
    WARN(3),
    ERROR(4);

    private final int severity;

    LogLevel(int severity) {
        this.severity = severity;
    }

    public boolean permits(LogLevel level) {
        return this.severity <= level.severity;
    }
}

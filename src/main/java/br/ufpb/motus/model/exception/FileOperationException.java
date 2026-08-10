package br.ufpb.motus.model.exception;

import java.nio.file.Path;

public class FileOperationException extends RuntimeException {
    private final String path;
    private final String operation;

    public FileOperationException(Path path, String operation, Throwable cause) {
        super(String.format("failed to perform '%s' on path: %s", operation, path), cause);
        this.path = path != null ? path.toString() : "unknown";
        this.operation = operation;
    }

    public String getPath() {
        return path;
    }

    public String getOperation() {
        return operation;
    }
}
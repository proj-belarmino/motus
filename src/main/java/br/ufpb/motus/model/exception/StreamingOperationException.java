package br.ufpb.motus.model.exception;

public class StreamingOperationException extends RuntimeException {
    public StreamingOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
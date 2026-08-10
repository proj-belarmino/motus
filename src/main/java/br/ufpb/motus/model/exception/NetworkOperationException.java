package br.ufpb.motus.model.exception;

public class NetworkOperationException extends RuntimeException {
    private final String url;
    private final int statusCode;

    public NetworkOperationException(String message, String url, int statusCode, Throwable cause) {
        super(String.format("%s | status: %d | url: %s", message, statusCode, url), cause);
        this.url = url;
        this.statusCode = statusCode;
    }

    public String getUrl() {
        return url;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
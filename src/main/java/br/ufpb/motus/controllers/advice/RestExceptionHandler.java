package br.ufpb.motus.controllers.advice;

import br.ufpb.motus.model.exception.InvalidCredentialsException;
import br.ufpb.motus.model.exception.InvalidRangeRequestException;
import br.ufpb.motus.model.exception.ResourceNotFoundException;
import br.ufpb.motus.model.exception.StreamingOperationException;
import br.ufpb.motus.model.exception.UserAlreadyExistsException;
import br.ufpb.motus.model.network.ApiErrorResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.Instant;

@RestControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleResourceNotFound(@NonNull ResourceNotFoundException ex, WebRequest request) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request, new HttpHeaders());
    }

    @ExceptionHandler(InvalidRangeRequestException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidRange(@NonNull InvalidRangeRequestException ex, WebRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_RANGE, "bytes */" + ex.getFileSize());
        return buildErrorResponse(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE, ex.getMessage(), request, headers);
    }

    @ExceptionHandler(StreamingOperationException.class)
    public ResponseEntity<ApiErrorResponse> handleStreamingOperation(@NonNull StreamingOperationException ex, WebRequest request) {
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage(), request, new HttpHeaders());
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidCredentials(@NonNull InvalidCredentialsException ex, WebRequest request) {
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request, new HttpHeaders());
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ApiErrorResponse> handleUserAlreadyExists(@NonNull UserAlreadyExistsException ex, WebRequest request) {
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), request, new HttpHeaders());
    }

    private @NonNull ResponseEntity<ApiErrorResponse> buildErrorResponse(@NonNull HttpStatus status, String message, @NonNull WebRequest request, HttpHeaders headers) {
        var body = new ApiErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getDescription(false).replace("uri=", "")
        );
        return new ResponseEntity<>(body, headers, status);
    }
}
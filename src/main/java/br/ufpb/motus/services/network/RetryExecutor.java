package br.ufpb.motus.services.network;

import br.ufpb.motus.model.exception.NetworkOperationException;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;

import java.util.function.Supplier;

@RequiredArgsConstructor
public final class RetryExecutor {

    private final int maxRetries;
    private final long delayMs;

    public <Type> Type execute(@NonNull Supplier<Type> action, @NonNull String url) {
        int attempts = 0;
        while (true) {
            try {
                return action.get();
            } catch (NetworkOperationException error) {
                attempts++;
                if (attempts >= maxRetries) {
                    throw error;
                }
                delayRetry(url);
            }
        }
    }

    private void delayRetry(@NonNull String url) {
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new NetworkOperationException("retry execution was interrupted", url, -1, error);
        }
    }
}
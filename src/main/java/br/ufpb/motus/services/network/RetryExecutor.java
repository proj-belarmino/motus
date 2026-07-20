package br.ufpb.motus.services.network;

import java.util.function.Supplier;

public final class RetryExecutor {
    private final int maxRetries;
    private final long delayMs;

    public RetryExecutor(int maxRetries, long delayMs) {
        this.maxRetries = maxRetries;
        this.delayMs = delayMs;
    }

    // Start delayed retry request routine.
    public <Type> Type execute(Supplier<Type> action) {
        int attempts = 0;
        while (true) {
            try {
                return action.get();
            } catch (RuntimeException error) {
                attempts++;
                if (attempts >= maxRetries) {
                    throw error;
                }
                delayRetry();
            }
        }
    }

    // Does jackshit, just waits and blocks.
    private void delayRetry() {
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Retry execution was interrupted", error);
        }
    }
}
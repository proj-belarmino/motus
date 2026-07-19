package br.ufpb.motus.services;

import org.jetbrains.annotations.Contract;
import org.jspecify.annotations.NonNull;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Supplier;

public final class TaskScheduler {
    private static final ExecutorService EXECUTOR = resolvePool();

    private TaskScheduler() {}

    // Submit new asynchronous task (with return value).
    @Contract(value = "_ -> new", pure = true)
    public static <Type> @NonNull TaskBuilder<Type> submit(Supplier<Type> task) {
        return new TaskBuilder<>(EXECUTOR, task);
    }

    // Submit new asynchronous task (no return value).
    @Contract(value = "_ -> new", pure = true)
    public static @NonNull TaskBuilder<Void> submit(Runnable task) {
        return new TaskBuilder<>(EXECUTOR, () -> {
            task.run();
            return null;
        });
    }

    // Ends operations orderly.
    public static void shutdown() {
        EXECUTOR.shutdown();
    }

    // Initialises the thread pool.
    private static @NonNull ExecutorService resolvePool() {
        var poolSize = Math.max(2, Runtime.getRuntime().availableProcessors());
        return Executors.newFixedThreadPool(poolSize);
    }
}



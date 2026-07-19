package br.ufpb.motus.services;

import org.jetbrains.annotations.Contract;
import org.jspecify.annotations.NonNull;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Supplier;

public final class TaskScheduler {
    private static final ExecutorService IO_EXECUTOR = resolveLightPool();
    private static final ExecutorService CPU_EXECUTOR = resolveHeavyPool();

    private TaskScheduler() {}

    // Submit new asynchronous task (with return value).
    @Contract(value = "_ -> new", pure = true)
    public static <Type> @NonNull TaskBuilder<Type> submit(Supplier<Type> task) {
        return new TaskBuilder<>(task);
    }

    // Submit new asynchronous task (no return value).
    @Contract(value = "_ -> new", pure = true)
    public static @NonNull TaskBuilder<Void> submit(Runnable task) {
        return new TaskBuilder<>(() -> {
            task.run();
            return null;
        });
    }

    // Ends operations orderly.
    public static void shutdown() {
        IO_EXECUTOR.shutdown();
        CPU_EXECUTOR.shutdown();
    }

    // Dynamically resolve executor.
    static void enqueue(Runnable task, boolean cpuBound) {
        ExecutorService executor = cpuBound ? CPU_EXECUTOR : IO_EXECUTOR;
        executor.submit(task);
    }

    // Initialises the IO thread pool.
    private static @NonNull ExecutorService resolveLightPool() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }

    // Initialises the CPU thread pool.
    private static @NonNull ExecutorService resolveHeavyPool() {
        var poolSize = Math.max(2, Runtime.getRuntime().availableProcessors());
        return Executors.newFixedThreadPool(poolSize);
    }
}



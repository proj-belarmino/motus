package br.ufpb.motus.services.tasks;

import br.ufpb.motus.services.log.Logger;
import org.jetbrains.annotations.Contract;
import org.jspecify.annotations.NonNull;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * stateless task dispatcher managing internal thread pools.
 * handles jvm shutdown gracefully.
 */
public final class TaskScheduler {

    private static final ExecutorService IO_EXECUTOR = Executors.newVirtualThreadPerTaskExecutor();
    private static final ExecutorService CPU_EXECUTOR = Executors.newFixedThreadPool(
            Math.max(2, Runtime.getRuntime().availableProcessors())
    );

    static {
        Runtime.getRuntime().addShutdownHook(new Thread(TaskScheduler::shutdown));
    }

    private TaskScheduler() {}

    @Contract(value = "_ -> new", pure = true)
    public static <Type> @NonNull TaskBuilder<Type> submit(Supplier<Type> task) {
        return new TaskBuilder<>(task);
    }

    @Contract(value = "_ -> new", pure = true)
    public static @NonNull TaskBuilder<Void> submit(Runnable task) {
        return new TaskBuilder<>(() -> {
            task.run();
            return null;
        });
    }

    static void enqueue(Runnable task, boolean cpuBound) {
        ExecutorService executor = cpuBound ? CPU_EXECUTOR : IO_EXECUTOR;
        executor.submit(task);
    }

    private static void shutdown() {
        Logger.info("shutting down task scheduler pools...");
        shutdownPool(IO_EXECUTOR, "io pool");
        shutdownPool(CPU_EXECUTOR, "cpu pool");
    }

    private static void shutdownPool(ExecutorService pool, String name) {
        pool.shutdown();
        try {
            if (!pool.awaitTermination(5, TimeUnit.SECONDS)) {
                pool.shutdownNow();
            }
        } catch (InterruptedException e) {
            pool.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
package br.ufpb.motus.services;

import java.util.concurrent.ExecutorService;
import java.util.function.Consumer;
import java.util.function.Supplier;

public final class TaskBuilder<Type> {
    private final ExecutorService executor;
    private final Supplier<Type> task;
    private Consumer<Type> onSuccess = result -> {};
    private Consumer<Throwable> onFailure = throwable -> {};

    // Builder.
    public TaskBuilder(ExecutorService executor, Supplier<Type> task) {
        this.executor = executor;
        this.task = task;
    }

    // Register success event callback.
    public TaskBuilder<Type> onSuccess(Consumer<Type> callback) {
        if (callback != null) {
            this.onSuccess = callback;
        }
        return this;
    }

    // Register failure event callback.
    public TaskBuilder<Type> onFailure(Consumer<Throwable> callback) {
        if (callback != null) {
            this.onFailure = callback;
        }
        return this;
    }

    // Dispatch task to execution queue.
    public void queue() {
        executor.submit(() -> {
            try {
                Type taskResult = task.get();
                onSuccess.accept(taskResult);
            } catch (Throwable throwable) {
                onFailure.accept(throwable);
            }
        });
    }
}

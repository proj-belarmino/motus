package br.ufpb.motus.services;

import java.util.function.Consumer;
import java.util.function.Supplier;

public final class TaskBuilder<Type> {
    private final Supplier<Type> task;
    private boolean cpuBound = false;
    private Consumer<Type> onSuccess = result -> {};
    private Consumer<Throwable> onFailure = throwable -> {};

    // Builder.
    TaskBuilder(Supplier<Type> task) {
        this.task = task;
    }

    // Mark the task as CPU bound.
    public TaskBuilder<Type> cpuBound() {
        this.cpuBound = true;
        return this;
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
        TaskScheduler.enqueue(() -> {
            try {
                Type taskResult = task.get();
                onSuccess.accept(taskResult);
            }  catch (Throwable throwable) {
                onFailure.accept(throwable);
            }
        }, cpuBound);
    }
}

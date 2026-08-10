package br.ufpb.motus.services.tasks;

import br.ufpb.motus.services.log.Logger;

import java.util.function.Consumer;
import java.util.function.Supplier;

public final class TaskBuilder<Type> {
    private final Supplier<Type> task;
    private boolean cpuBound = false;
    private Consumer<Type> onSuccess = result -> {};

    private Consumer<Throwable> onFailure = throwable ->
            Logger.error("Unhandled exception occurred during background task execution", throwable);

    TaskBuilder(Supplier<Type> task) {
        this.task = task;
    }

    public TaskBuilder<Type> cpuBound() {
        this.cpuBound = true;
        return this;
    }

    public TaskBuilder<Type> onSuccess(Consumer<Type> callback) {
        if (callback != null) {
            this.onSuccess = callback;
        }
        return this;
    }

    public TaskBuilder<Type> onFailure(Consumer<Throwable> callback) {
        if (callback != null) {
            this.onFailure = callback;
        }
        return this;
    }

    public void queue() {
        TaskScheduler.enqueue(() -> {
            try {
                Type taskResult = task.get();
                onSuccess.accept(taskResult);
            } catch (Throwable throwable) {
                onFailure.accept(throwable);
            }
        }, cpuBound);
    }
}
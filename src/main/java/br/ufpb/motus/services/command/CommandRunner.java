package br.ufpb.motus.services.command;

import br.ufpb.motus.model.command.CommandResult;
import br.ufpb.motus.model.exception.CommandExecutionException;
import org.jspecify.annotations.NonNull;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * immutable builder for executing external processes.
 */
public final class CommandRunner {
    private final List<String> command;
    private final Duration timeout;

    private CommandRunner(List<String> command, Duration timeout) {
        this.command = List.copyOf(command);
        this.timeout = timeout;
    }

    public static @NonNull CommandRunner command(String baseCommand, String... initialArguments) {
        List<String> fullCommand = new ArrayList<>();
        fullCommand.add(baseCommand);
        if (initialArguments != null) {
            fullCommand.addAll(Arrays.asList(initialArguments));
        }
        return new CommandRunner(fullCommand, Duration.ofMinutes(5));
    }

    public CommandRunner withArgument(String argument) {
        if (argument == null) return this;
        List<String> newCommand = new ArrayList<>(this.command);
        newCommand.add(argument);
        return new CommandRunner(newCommand, this.timeout);
    }

    public CommandRunner withArguments(String... arguments) {
        if (arguments == null || arguments.length == 0) return this;
        List<String> newCommand = new ArrayList<>(this.command);
        newCommand.addAll(Arrays.asList(arguments));
        return new CommandRunner(newCommand, this.timeout);
    }

    public CommandRunner withTimeout(Duration timeout) {
        return new CommandRunner(this.command, timeout);
    }

    @org.jetbrains.annotations.Contract(" -> new")
    public @NonNull CommandResult run() {
        Process process = null;
        String fullCommandStr = String.join(" ", command);

        try {
            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.redirectErrorStream(true);
            process = processBuilder.start();

            boolean finished = process.waitFor(timeout.toMillis(), TimeUnit.MILLISECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new CommandExecutionException("command timed out", fullCommandStr, -1, "");
            }

            int exitCode = process.exitValue();
            String outputBuffer;

            try (var inputReader = new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8);
                 var bufferedReader = new BufferedReader(inputReader)) {
                outputBuffer = bufferedReader.lines().collect(Collectors.joining("\n"));
            }

            if (exitCode != 0) {
                throw new CommandExecutionException("command failed", fullCommandStr, exitCode, outputBuffer);
            }

            return new CommandResult(exitCode, outputBuffer);

        } catch (IOException error) {
            ensureDestruction(process);
            throw new CommandExecutionException("io error executing command", fullCommandStr, -1, error.getMessage());
        } catch (InterruptedException error) {
            ensureDestruction(process);
            Thread.currentThread().interrupt();
            throw new CommandExecutionException("command interrupted", fullCommandStr, -1, error.getMessage());
        }
    }

    private void ensureDestruction(Process process) {
        if (process != null && process.isAlive()) {
            process.destroyForcibly();
        }
    }
}
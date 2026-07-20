package br.ufpb.motus.services.commands;

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

import br.ufpb.motus.model.CommandResult;
import org.jspecify.annotations.NonNull;

public final class CommandRunner {
    private final List<String> command = new ArrayList<>();
    private Duration timeout = Duration.ofMinutes(5);

    // Privately construct from a single root command string
    private CommandRunner(String baseCommand) {
        this.command.add(baseCommand);
    }

    // Privately construct from a full command declaration
    private CommandRunner(List<String> command) {
        this.command.addAll(command);
    }

    // Public constructor (as static method) for commands, resolves what is used
    public static @NonNull CommandRunner command(String baseCommand, String... initialArguments) {
        CommandRunner runner = new CommandRunner(baseCommand);
        runner.command.addAll(Arrays.asList(initialArguments));
        return runner;
    }

    // Passes a new argument to the instantiated command
    public CommandRunner withArgument(String argument) {
        if (argument != null) {
            this.command.add(argument);
        }
        return this;
    }

    // Passes arguments in batch to the instantiated command
    public CommandRunner withArguments(String... arguments) {
        if (arguments != null) {
            this.command.addAll(Arrays.asList(arguments));
        }
        return this;
    }

    // Sets the timeout for the instantiated command
    public CommandRunner withTimeout(Duration timeout) {
        this.timeout = timeout;
        return this;
    }

    // Executes the command
    @org.jetbrains.annotations.Contract(" -> new")
    public @NonNull CommandResult run() {
        Process process = null;
        try {
            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.redirectErrorStream(true);

            process = processBuilder.start();

            boolean finished = process.waitFor(timeout.toMillis(), TimeUnit.MILLISECONDS);
            if (!finished) {
                process.destroyForcibly();
                String fullCommand = String.join(" ", command);
                String exception = String.format("Command timed out after %d seconds: %s", timeout.toSeconds(), fullCommand);
                throw new RuntimeException(exception);
            }

            int exitCode = process.exitValue();
            String outputBuffer;

            var inputStream = process.getInputStream();
            var inputReader = new InputStreamReader(inputStream, StandardCharsets.UTF_8);
            var bufferedReader = new BufferedReader(inputReader);

            try(bufferedReader) {
                var lineCollector = Collectors.joining("\n");
                outputBuffer = bufferedReader.lines().collect(lineCollector);
            }

            if (exitCode != 0) {
                String exception = String.format("Command failed with exit code: %d. Output:\n%s", exitCode, outputBuffer);
                throw new RuntimeException(exception);
            }

            return new CommandResult(exitCode, outputBuffer);
        } catch (IOException error) {
            ensureDestruction(process);
            throw new RuntimeException(error);
        } catch (InterruptedException error) {
            ensureDestruction(process);
            Thread.currentThread().interrupt();
            throw new RuntimeException(error);
        }
    }

    private void ensureDestruction(Process process) {
        boolean valid = process != null && process.isAlive();
        if (valid) {
            process.destroyForcibly();
        }
    }
}

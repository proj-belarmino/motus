package br.ufpb.motus.model.exception;

public class CommandExecutionException extends RuntimeException {
    private final String command;
    private final int exitCode;
    private final String output;

    public CommandExecutionException(String message, String command, int exitCode, String output) {
        super(String.format("%s | code: %d | command: %s", message, exitCode, command));
        this.command = command;
        this.exitCode = exitCode;
        this.output = output;
    }

    public String getCommand() {
        return command;
    }

    public int getExitCode() {
        return exitCode;
    }

    public String getOutput() {
        return output;
    }
}
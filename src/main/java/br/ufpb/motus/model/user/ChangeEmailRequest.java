package br.ufpb.motus.model.user;

public record ChangeEmailRequest(
        String newEmail
) {}
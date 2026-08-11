package br.ufpb.motus.model.user;

public record ChangePasswordRequest(
        String oldPassword,
        String newPassword
) {}
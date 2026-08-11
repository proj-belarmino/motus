package br.ufpb.motus.model.user;

public record RegisterRequest(
        String email,
        String password
) {}
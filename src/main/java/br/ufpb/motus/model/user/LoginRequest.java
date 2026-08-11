package br.ufpb.motus.model.user;

public record LoginRequest(
        String email,
        String password
) {}
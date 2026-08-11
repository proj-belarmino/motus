package br.ufpb.motus.model.user;

public record AuthResponse(
        String token,
        AuthUserDto user
) {}
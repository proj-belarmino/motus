package br.ufpb.motus.model.user;

public record AuthUserDto(
        String id,
        String email,
        String name,
        String handle,
        String role,
        String avatarPath
) {}

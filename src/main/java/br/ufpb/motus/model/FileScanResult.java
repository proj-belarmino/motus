package br.ufpb.motus.model;

import java.nio.file.Path;

public record FileScanResult(
        Path path,
        long size,
        long lastModified,
        String hash,
        boolean isCompatible
) {}

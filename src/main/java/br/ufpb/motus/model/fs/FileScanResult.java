package br.ufpb.motus.model.fs;

import java.nio.file.Path;

public record FileScanResult(
        Path path,
        long size,
        long lastModified,
        String hash,
        boolean isCompatible
) {}

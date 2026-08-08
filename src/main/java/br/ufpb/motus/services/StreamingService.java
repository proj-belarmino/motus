package br.ufpb.motus.services;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class StreamingService {

    /**
     * Loads a physical media file from the disk as a Spring Resource.
     */
    public Resource loadMediaAsResource(String filePath) {
        try {
            Path path = Paths.get(filePath);
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Media file not found or not readable at: " + filePath);
            }
        } catch (Exception e) {
            throw new RuntimeException("Could not read media file: " + filePath, e);
        }
    }
}
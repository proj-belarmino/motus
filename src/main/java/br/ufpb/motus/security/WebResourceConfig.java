package br.ufpb.motus.security;

import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebResourceConfig implements WebMvcConfigurer {

    private final String thumbnailsPath;

    public WebResourceConfig(@Value("${motus.fs.thumbnails.path:./thumbnails}") String thumbnailsPath) {
        this.thumbnailsPath = thumbnailsPath;
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        String absoluteThumbnailsPath = Paths.get(thumbnailsPath).toAbsolutePath().toUri().toString();

        if (!absoluteThumbnailsPath.endsWith("/")) {
            absoluteThumbnailsPath += "/";
        }

        registry.addResourceHandler("/api/thumbnails/**")
                .addResourceLocations(absoluteThumbnailsPath);
    }
}
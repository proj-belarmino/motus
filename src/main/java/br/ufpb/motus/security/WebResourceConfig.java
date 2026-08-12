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
    private final String avatarsPath;

    public WebResourceConfig(@Value("${motus.fs.thumbnails.path:./thumbnails}") String thumbnailsPath, @Value("${motus.fs.avatars.path:./avatars}") String avatarsPath) {
        this.thumbnailsPath = thumbnailsPath;
        this.avatarsPath = avatarsPath;
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        String absoluteThumbnailsPath = Paths.get(thumbnailsPath).toAbsolutePath().toUri().toString();

        if (!absoluteThumbnailsPath.endsWith("/")) {
            absoluteThumbnailsPath += "/";
        }

        registry.addResourceHandler("/api/thumbnails/**")
                .addResourceLocations(absoluteThumbnailsPath);
        String absoluteAvatarsPath = Paths.get(avatarsPath).toAbsolutePath().toUri().toString();
        registry.addResourceHandler("/api/avatars/**").addResourceLocations(absoluteAvatarsPath.endsWith("/") ? absoluteAvatarsPath : absoluteAvatarsPath + "/");
    }
}

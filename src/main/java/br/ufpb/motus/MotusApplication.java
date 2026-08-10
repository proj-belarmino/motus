package br.ufpb.motus;

import br.ufpb.motus.model.movie.ExternalMovieInfo;
import br.ufpb.motus.model.movie.MovieEntity;
import br.ufpb.motus.services.movie.MovieMetadataService;
import br.ufpb.motus.services.movie.MovieRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.nio.file.Files;
import java.nio.file.Path;

@SpringBootApplication
public class MotusApplication {

    public static void main(String[] args) {
        SpringApplication.run(MotusApplication.class, args);
    }

    @Bean
    CommandLineRunner testMovieImport(MovieRepository movieRepository) {
        return args -> {
            String apiKey = System.getenv("TMDB_API_KEY");
            MovieMetadataService metadataService = new MovieMetadataService(apiKey);

            Path filePath = Files.createTempFile("inception", ".mp4");
            Files.writeString(filePath, "arquivo de teste");

            ExternalMovieInfo info = metadataService.fetchByTitle("Inception");
            MovieEntity entity = metadataService.toEntity(filePath, info);

            MovieEntity saved = movieRepository.save(entity);
            System.out.println("Filme salvo: " + saved.getId() + " - " + saved.getTitle() + " (" + saved.getRating() + ")");
        };
    }
}

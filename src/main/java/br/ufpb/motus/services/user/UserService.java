package br.ufpb.motus.services.user;

import br.ufpb.motus.model.exception.InvalidCredentialsException;
import br.ufpb.motus.model.exception.ResourceNotFoundException;
import br.ufpb.motus.model.exception.UserAlreadyExistsException;
import br.ufpb.motus.model.user.ChangeEmailRequest;
import br.ufpb.motus.model.user.ChangePasswordRequest;
import br.ufpb.motus.model.user.UserEntity;
import org.jspecify.annotations.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import br.ufpb.motus.model.movie.Movie;
import br.ufpb.motus.model.movie.MovieEntity;
import br.ufpb.motus.services.movie.MovieRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final br.ufpb.motus.services.security.JwtService jwtService;
    private final UserActivityRepository userActivityRepository;
    private final Path avatarsPath;
    private final MovieRepository movieRepository;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, br.ufpb.motus.services.security.JwtService jwtService, UserActivityRepository userActivityRepository, MovieRepository movieRepository, @org.springframework.beans.factory.annotation.Value("${motus.fs.avatars.path:./avatars}") String avatarsPath) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userActivityRepository = userActivityRepository;
        this.avatarsPath = Path.of(avatarsPath).toAbsolutePath().normalize();
        this.movieRepository = movieRepository;
    }

    @Transactional
    public void changePassword(String userId, @NonNull ChangePasswordRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!passwordEncoder.matches(request.oldPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void changeEmail(String userId, @NonNull ChangeEmailRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (userRepository.existsByEmail(request.newEmail())) {
            throw new UserAlreadyExistsException(request.newEmail());
        }

        user.setEmail(request.newEmail());
        userRepository.save(user);
    }

    @Transactional
    public br.ufpb.motus.model.user.AuthResponse updateProfile(String userId, br.ufpb.motus.controllers.UserController.ProfileUpdateRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (request.email() != null && !request.email().isBlank() && !request.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new UserAlreadyExistsException(request.email());
            }
            user.setEmail(request.email());
        }

        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name());
        }

        if (request.handle() != null && !request.handle().isBlank() && !request.handle().equalsIgnoreCase(user.getHandle())) {
            String handle = request.handle().trim().toLowerCase();
            if (!handle.matches("[a-z0-9_]{3,24}")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Handles use 3-24 lowercase letters, numbers, or underscores.");
            if (userRepository.existsByHandleIgnoreCase(handle)) throw new ResponseStatusException(HttpStatus.CONFLICT, "That handle is already in use.");
            user.setHandle(handle);
        }

        if (request.newPassword() != null && !request.newPassword().isBlank() && request.currentPassword() != null) {
            if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
                throw new InvalidCredentialsException();
            }
            user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        }

        userRepository.save(user);

        String token = jwtService.generateToken(user);
        br.ufpb.motus.model.user.AuthUserDto dto = toDto(user);
        return new br.ufpb.motus.model.user.AuthResponse(token, dto);
    }

    @Transactional
    public br.ufpb.motus.model.user.AuthResponse updateAvatar(String userId, MultipartFile file) {
        UserEntity user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (file.isEmpty() || file.getSize() > 5 * 1024 * 1024 || file.getContentType() == null || !file.getContentType().startsWith("image/")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an image smaller than 5 MB.");
        String extension = switch (file.getContentType()) { case "image/jpeg" -> "jpg"; case "image/png" -> "png"; case "image/webp" -> "webp"; default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a JPEG, PNG, or WebP image."); };
        try {
            Files.createDirectories(avatarsPath);
            if (user.getAvatarPath() != null) Files.deleteIfExists(avatarsPath.resolve(user.getAvatarPath()).normalize());
            String filename = userId + "." + extension;
            Files.copy(file.getInputStream(), avatarsPath.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            user.setAvatarPath(filename);
            userRepository.save(user);
        } catch (IOException exception) { throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save profile picture.", exception); }
        return new br.ufpb.motus.model.user.AuthResponse(jwtService.generateToken(user), toDto(user));
    }

    @Transactional
    public void recordActivity(String userId, String movieId) {
        if (movieId == null || !movieRepository.existsById(movieId)) throw new ResourceNotFoundException("Movie", movieId);
        userActivityRepository.save(new br.ufpb.motus.model.user.UserActivityEntity(userId, LocalDate.now(), movieId));
    }

    @Transactional(readOnly = true)
    public List<br.ufpb.motus.model.user.ActivityDay> getActivity(String userId) { return userActivityRepository.findDailyCounts(userId, LocalDate.now().minusDays(364)).stream().map(row -> new br.ufpb.motus.model.user.ActivityDay((LocalDate) row[0], ((Number) row[1]).longValue())).toList(); }

    @Transactional(readOnly = true)
    public List<Movie> getRecentMovies(String userId) {
        List<String> ids = userActivityRepository.findRecentMovieIds(userId, 12);
        Map<String, MovieEntity> movies = movieRepository.findAllById(ids).stream().collect(java.util.stream.Collectors.toMap(MovieEntity::getId, Function.identity()));
        return ids.stream().map(movies::get).filter(java.util.Objects::nonNull).map(Movie::fromEntity).toList();
    }

    private br.ufpb.motus.model.user.AuthUserDto toDto(UserEntity user) { return new br.ufpb.motus.model.user.AuthUserDto(user.getId(), user.getEmail(), user.getName(), user.getHandle(), user.getRole(), user.getAvatarPath()); }
}

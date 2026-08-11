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

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final br.ufpb.motus.services.security.JwtService jwtService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, br.ufpb.motus.services.security.JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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

        if (request.newPassword() != null && !request.newPassword().isBlank() && request.currentPassword() != null) {
            if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
                throw new InvalidCredentialsException();
            }
            user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        }

        userRepository.save(user);

        String token = jwtService.generateToken(user);
        br.ufpb.motus.model.user.AuthUserDto dto = new br.ufpb.motus.model.user.AuthUserDto(user.getId(), user.getEmail(), user.getName(), user.getRole());
        return new br.ufpb.motus.model.user.AuthResponse(token, dto);
    }
}
package br.ufpb.motus.services.security;

import br.ufpb.motus.model.exception.InvalidCredentialsException;
import br.ufpb.motus.model.exception.UserAlreadyExistsException;
import br.ufpb.motus.model.user.AuthResponse;
import br.ufpb.motus.model.user.AuthUserDto;
import br.ufpb.motus.model.user.LoginRequest;
import br.ufpb.motus.model.user.RegisterRequest;
import br.ufpb.motus.model.user.UserEntity;
import br.ufpb.motus.services.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new UserAlreadyExistsException(request.email());
        }

        String fallbackName = request.email().split("@")[0];

        UserEntity user = new UserEntity(
                UUID.randomUUID().toString(),
                request.email(),
                fallbackName,
                passwordEncoder.encode(request.password()),
                "USER"
        );
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByEmail(request.email())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(user);
        AuthUserDto dto = new AuthUserDto(user.getId(), user.getEmail(), user.getName(), user.getRole());

        return new AuthResponse(token, dto);
    }
}
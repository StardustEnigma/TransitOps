package com.transitops_backend.service;

import com.transitops_backend.dto.auth.AuthResponse;
import com.transitops_backend.dto.auth.LoginRequest;
import com.transitops_backend.dto.auth.RegisterRequest;
import com.transitops_backend.entity.Role;
import com.transitops_backend.entity.User;
import com.transitops_backend.exception.BusinessRuleException;
import com.transitops_backend.exception.ResourceNotFoundException;
import com.transitops_backend.repository.RoleRepository;
import com.transitops_backend.repository.UserRepository;
import com.transitops_backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessRuleException("Email already registered: " + request.getEmail());
        }

        Role role = roleRepository.findByName(request.getRoleName())
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", request.getRoleName()));

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .isActive(true)
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail(), role.getName());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(role.getName())
                .name(user.getName())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.getIsActive()) {
            throw new BusinessRuleException("Account is deactivated");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole().getName());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().getName())
                .name(user.getName())
                .build();
    }
}

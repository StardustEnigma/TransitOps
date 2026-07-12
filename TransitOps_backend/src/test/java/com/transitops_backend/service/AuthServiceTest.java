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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private Role fleetManagerRole;
    private Role driverRole;
    private User testUser;

    @BeforeEach
    void setUp() {
        fleetManagerRole = Role.builder()
                .id(1L)
                .name("FLEET_MANAGER")
                .description("Fleet Manager Description")
                .build();

        driverRole = Role.builder()
                .id(2L)
                .name("DRIVER")
                .description("Driver Description")
                .build();

        testUser = User.builder()
                .id(1L)
                .name("Alice")
                .email("alice@test.com")
                .passwordHash("hashed_password")
                .role(fleetManagerRole)
                .isActive(true)
                .build();
    }

    @Test
    void register_Success() {
        RegisterRequest request = new RegisterRequest("Alice", "alice@test.com", "password", "DRIVER");
        User driverUser = User.builder()
                .id(1L)
                .name("Alice")
                .email("alice@test.com")
                .passwordHash("hashed_password")
                .role(driverRole)
                .isActive(true)
                .build();

        when(userRepository.existsByEmail("alice@test.com")).thenReturn(false);
        when(roleRepository.findByName("DRIVER")).thenReturn(Optional.of(driverRole));
        when(passwordEncoder.encode("password")).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(driverUser);
        when(jwtService.generateToken("alice@test.com", "DRIVER")).thenReturn("test_token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("test_token", response.getToken());
        assertEquals("alice@test.com", response.getEmail());
        assertEquals("DRIVER", response.getRole());
        assertEquals("Alice", response.getName());

        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_ThrowsException_WhenRoleNotSelfRegisterable() {
        RegisterRequest request = new RegisterRequest("Alice", "alice@test.com", "password", "FLEET_MANAGER");

        assertThrows(BusinessRuleException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_ThrowsException_WhenEmailExists() {
        RegisterRequest request = new RegisterRequest("Alice", "alice@test.com", "password", "DRIVER");

        when(userRepository.existsByEmail("alice@test.com")).thenReturn(true);

        assertThrows(BusinessRuleException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_ThrowsException_WhenRoleNotFound() {
        RegisterRequest request = new RegisterRequest("Alice", "alice@test.com", "password", "DRIVER");

        when(userRepository.existsByEmail("alice@test.com")).thenReturn(false);
        when(roleRepository.findByName("DRIVER")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.register(request));
    }

    @Test
    void registerStaff_Success_BypassesSelfRegisterRestriction() {
        RegisterRequest request = new RegisterRequest("Alice", "alice@test.com", "password", "FLEET_MANAGER");

        when(userRepository.existsByEmail("alice@test.com")).thenReturn(false);
        when(roleRepository.findByName("FLEET_MANAGER")).thenReturn(Optional.of(fleetManagerRole));
        when(passwordEncoder.encode("password")).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtService.generateToken("alice@test.com", "FLEET_MANAGER")).thenReturn("test_token");

        AuthResponse response = authService.registerStaff(request);

        assertNotNull(response);
        assertEquals("FLEET_MANAGER", response.getRole());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void login_Success() {
        LoginRequest request = new LoginRequest("alice@test.com", "password");

        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password", "hashed_password")).thenReturn(true);
        when(jwtService.generateToken("alice@test.com", "FLEET_MANAGER")).thenReturn("test_token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("test_token", response.getToken());
        assertEquals("alice@test.com", response.getEmail());
        assertEquals("FLEET_MANAGER", response.getRole());
    }

    @Test
    void login_ThrowsException_WhenUserNotFound() {
        LoginRequest request = new LoginRequest("nonexistent@test.com", "password");

        when(userRepository.findByEmail("nonexistent@test.com")).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void login_ThrowsException_WhenPasswordIncorrect() {
        LoginRequest request = new LoginRequest("alice@test.com", "wrong_password");

        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrong_password", "hashed_password")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void login_ThrowsException_WhenUserDeactivated() {
        testUser.setIsActive(false);
        LoginRequest request = new LoginRequest("alice@test.com", "password");

        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password", "hashed_password")).thenReturn(true);

        assertThrows(BusinessRuleException.class, () -> authService.login(request));
    }
}

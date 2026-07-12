package com.transitops_backend.controller;

import com.transitops_backend.dto.auth.AuthResponse;
import com.transitops_backend.dto.auth.LoginRequest;
import com.transitops_backend.dto.auth.RegisterRequest;
import com.transitops_backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/register/staff")
    @PreAuthorize("hasRole('FLEET_MANAGER')")
    public ResponseEntity<AuthResponse> registerStaff(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.registerStaff(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}

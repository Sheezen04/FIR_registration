package com.example.Backend.service;

import com.example.Backend.dto.*;
import com.example.Backend.entity.Role;
import com.example.Backend.entity.User;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail().trim());
        // Trim password to ensure consistent handling
        user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        user.setRole(request.getRole() != null ? request.getRole() : Role.CITIZEN);
        user.setStation(request.getStation());

        user = userRepository.save(user);

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .station(user.getStation())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // Trim email and password for consistent handling
        String email = request.getEmail().trim();
        String password = request.getPassword().trim();
        
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify role matches if specified
        if (request.getRole() != null && user.getRole() != request.getRole()) {
            throw new RuntimeException("Invalid role for this account");
        }

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .station(user.getStation())
                .build();
    }
}

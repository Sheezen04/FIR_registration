package com.example.Backend.service;

import com.example.Backend.dto.UpdateProfileRequest; // Make sure to import the new DTO
import com.example.Backend.dto.UserResponse;
import com.example.Backend.entity.Role;
import com.example.Backend.entity.User;
import com.example.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToResponse(user);
    }

    public UserResponse createUser(String name, String email, String password, Role role, String station) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email.trim());
        // Trim password for consistent handling
        user.setPassword(passwordEncoder.encode(password.trim()));
        user.setRole(role);
        user.setStation(station);

        user = userRepository.save(user);
        return mapToResponse(user);
    }

    /**
     * Updates the logged-in user's profile.
     * Verifies current password before allowing changes.
     */
    public UserResponse updateProfile(String currentEmail, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Verify Current Password (Security Check)
        String currentPassword = request.getCurrentPassword();
        if (currentPassword == null || currentPassword.trim().isEmpty()) {
            throw new RuntimeException("Current password is required");
        }
        
        // Trim whitespace from the password to handle form input inconsistencies
        currentPassword = currentPassword.trim();
        
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Invalid current password");
        }

        // 2. Update Name
        if (request.getName() != null && !request.getName().isEmpty()) {
            user.setName(request.getName());
        }

        // 3. Update Email (Check if unique)
        if (request.getEmail() != null && !request.getEmail().isEmpty() && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(request.getEmail().trim());
        }

        // 4. Update Password (If provided)
        if (request.getNewPassword() != null && !request.getNewPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        }

        User updatedUser = userRepository.save(user);
        return mapToResponse(updatedUser);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public long countByRole(Role role) {
        return userRepository.findByRole(role).size();
    }

    public long countAll() {
        return userRepository.count();
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .station(user.getStation())
                .build();
    }
}
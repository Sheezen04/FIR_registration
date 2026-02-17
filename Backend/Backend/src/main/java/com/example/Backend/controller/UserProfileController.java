package com.example.Backend.controller;

import com.example.Backend.dto.UpdateProfileRequest;
import com.example.Backend.dto.UserResponse;
import com.example.Backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/users") // General user endpoint, not admin specific
@RequiredArgsConstructor
@CrossOrigin
public class UserProfileController {

    private final UserService userService;

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody UpdateProfileRequest request,
            Principal principal) { // Principal holds the currently logged-in user's email from the Token
        try {
            UserResponse updatedUser = userService.updateProfile(principal.getName(), request);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            String message = e.getMessage();
            if (message.contains("Invalid current password") || message.contains("password")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", message));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", message));
        }
    }
}
package com.example.Backend.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String name;
    private String email;
    private String currentPassword; // Required for security
    private String newPassword;     // Optional
}
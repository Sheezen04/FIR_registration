package com.example.Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatUserDTO {
    private Long id;
    private String name;
    private String email;
    private String station;
    private boolean online;
    private String lastSeen;
}

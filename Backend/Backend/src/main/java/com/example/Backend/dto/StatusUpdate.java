package com.example.Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusUpdate {
    private Long userId;
    private String userName;
    private boolean online;
    private String lastSeen;
}

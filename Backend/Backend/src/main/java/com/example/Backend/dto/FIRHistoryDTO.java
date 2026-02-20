package com.example.Backend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class FIRHistoryDTO {
    private Long id;
    private String action;
    private String description;
    private String officerName;
    private LocalDateTime timestamp;
}
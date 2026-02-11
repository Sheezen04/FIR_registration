package com.example.Backend.dto;

import com.example.Backend.entity.Priority;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FIRRequest {
    private String incidentType;
    private String description;
    private LocalDateTime dateTime;
    private Priority priority;
    private String location;
    private List<String> evidenceFiles;
}

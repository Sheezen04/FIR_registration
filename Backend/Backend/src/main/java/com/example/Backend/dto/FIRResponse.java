package com.example.Backend.dto;

import com.example.Backend.entity.FIRStatus;
import com.example.Backend.entity.Priority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FIRResponse {
    private Long id;
    private String firNumber;
    private String complainantName;
    private String complainantEmail;
    private String incidentType;
    private String description;
    private LocalDateTime dateTime;
    private Priority priority;
    private String location;
    private FIRStatus status;
    private String assignedStation;
    private String assignedOfficer;
    private String remarks;
    private List<String> actionNotes;
    private List<String> evidenceFiles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ✅ Added History Field for Audit Logs
    private List<FIRHistoryDTO> history;
}
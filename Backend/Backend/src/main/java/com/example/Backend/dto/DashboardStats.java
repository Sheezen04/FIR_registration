package com.example.Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private long totalFirs;
    private long pendingFirs;
    private long approvedFirs;
    private long rejectedFirs;
    private long underInvestigationFirs;
    private long inProgressFirs;
    private long closedFirs;
    private long emergencyFirs;
    private long totalUsers;
    private long policeOfficers;
    private Map<String, Long> firsByIncidentType;
    private Map<String, Long> firsByPriority;
    private Map<String, Long> firsByStatus;
}

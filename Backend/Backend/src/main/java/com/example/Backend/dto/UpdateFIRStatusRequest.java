package com.example.Backend.dto;

import com.example.Backend.entity.FIRStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFIRStatusRequest {
    private FIRStatus status;
    private String remarks;
    private String actionNote;
    private String assignedStation;
    private String assignedOfficer;
    private Long assignedOfficerId;
}

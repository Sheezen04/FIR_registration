package com.example.Backend.service;

import com.example.Backend.dto.*;
import com.example.Backend.entity.*;
import com.example.Backend.repository.FIRHistoryRepository;
import com.example.Backend.repository.FIRRepository;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.specification.FIRSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FIRService {

    private final FIRRepository firRepository;
    private final UserRepository userRepository;
    private final FIRHistoryRepository firHistoryRepository; // ✅ Added Repository

    @Transactional
    public FIRResponse createFIR(FIRRequest request, User user) {
        FIR fir = new FIR();
        fir.setFirNumber(generateFirNumber());
        fir.setComplainantName(user.getName());
        fir.setComplainantEmail(user.getEmail());
        fir.setIncidentType(request.getIncidentType());
        fir.setDescription(request.getDescription());
        fir.setDateTime(request.getDateTime());
        fir.setPriority(request.getPriority());
        fir.setLocation(request.getLocation());
        fir.setStatus(FIRStatus.PENDING);
        fir.setUser(user);

        if (request.getEvidenceFiles() != null) {
            fir.setEvidenceFiles(request.getEvidenceFiles());
        }

        fir = firRepository.save(fir);
        
        // Optional: Log creation event
        createHistoryLog(fir, user, "CREATED", "FIR Filed by " + user.getName());

        return mapToResponse(fir);
    }

    public List<FIRResponse> getAllFIRs() {
        return firRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public PagedResponse<FIRResponse> getPaginatedFIRs(
            int page,
            int size,
            String search,
            String complainant,
            String status,
            String priority,
            String incidentType,
            String dateFilter
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Specification<FIR> spec = FIRSpecification.withFilters(
                search, complainant, status, priority, incidentType, dateFilter
        );
        
        Page<FIR> firPage = firRepository.findAll(spec, pageable);
        
        List<FIRResponse> content = firPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return PagedResponse.<FIRResponse>builder()
                .content(content)
                .page(firPage.getNumber())
                .size(firPage.getSize())
                .totalElements(firPage.getTotalElements())
                .totalPages(firPage.getTotalPages())
                .hasNext(firPage.hasNext())
                .hasPrevious(firPage.hasPrevious())
                .isFirst(firPage.isFirst())
                .isLast(firPage.isLast())
                .build();
    }

    public List<FIRResponse> getFIRsByUser(User user) {
        return firRepository.findByUserId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FIRResponse> getFIRsByEmail(String email) {
        return firRepository.findByComplainantEmail(email).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FIRResponse> getFIRsByStatus(FIRStatus status) {
        return firRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FIRResponse> getFIRsByOfficer(Long officerId) {
        return firRepository.findByAssignedOfficerId(officerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FIRResponse> getFIRsByStation(String station) {
        return firRepository.findByAssignedStation(station).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public FIRResponse getFIRById(Long id) {
        FIR fir = firRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FIR not found"));
        return mapToResponse(fir);
    }

    public FIRResponse getFIRByNumber(String firNumber) {
        FIR fir = firRepository.findByFirNumber(firNumber)
                .orElseThrow(() -> new RuntimeException("FIR not found"));
        return mapToResponse(fir);
    }

    // ✅ UPDATED: Now accepts User for logging history
    @Transactional
    public FIRResponse updateFIRStatus(Long id, UpdateFIRStatusRequest request, User currentUser) {
        FIR fir = firRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FIR not found"));

        // 1. Status Change Log
        if (request.getStatus() != null && fir.getStatus() != request.getStatus()) {
            String desc = "Status changed from " + fir.getStatus() + " to " + request.getStatus();
            createHistoryLog(fir, currentUser, "STATUS_CHANGE", desc);
            fir.setStatus(request.getStatus());
        }

        // 2. Remarks Log
        if (request.getRemarks() != null && !request.getRemarks().isEmpty()) {
            // Only log if remarks actually changed
            if (!request.getRemarks().equals(fir.getRemarks())) {
                createHistoryLog(fir, currentUser, "COMMENT", "Added/Updated remark: " + request.getRemarks());
                fir.setRemarks(request.getRemarks());
            }
        }

        if (request.getActionNote() != null && !request.getActionNote().isEmpty()) {
            fir.getActionNotes().add(request.getActionNote());
            // Optional: Log action note addition
            createHistoryLog(fir, currentUser, "NOTE", "Added action note");
        }

        // 3. Assignment Logs
        if (request.getAssignedStation() != null) {
            fir.setAssignedStation(request.getAssignedStation());
        }

        if (request.getAssignedOfficer() != null) {
            fir.setAssignedOfficer(request.getAssignedOfficer());
        }

        if (request.getAssignedOfficerId() != null) {
            fir.setAssignedOfficerId(request.getAssignedOfficerId());
        }

        fir = firRepository.save(fir);
        return mapToResponse(fir);
    }

    // ✅ Helper to save history
    private void createHistoryLog(FIR fir, User user, String action, String description) {
        FIRHistory history = FIRHistory.builder()
                .fir(fir)
                .changedBy(user)
                .action(action)
                .description(description)
                .build();
        firHistoryRepository.save(history);
    }

    public DashboardStats getDashboardStats() {
        Map<String, Long> firsByIncidentType = new HashMap<>();
        List<Object[]> typeStats = firRepository.countByIncidentType();
        for (Object[] stat : typeStats) {
            firsByIncidentType.put((String) stat[0], (Long) stat[1]);
        }

        Map<String, Long> firsByPriority = new HashMap<>();
        for (Priority p : Priority.values()) {
            firsByPriority.put(p.name(), firRepository.countByPriority(p));
        }

        Map<String, Long> firsByStatus = new HashMap<>();
        for (FIRStatus s : FIRStatus.values()) {
            firsByStatus.put(s.name(), firRepository.countByStatus(s));
        }

        return DashboardStats.builder()
                .totalFirs(firRepository.count())
                .pendingFirs(firRepository.countByStatus(FIRStatus.PENDING))
                .approvedFirs(firRepository.countByStatus(FIRStatus.APPROVED))
                .rejectedFirs(firRepository.countByStatus(FIRStatus.REJECTED))
                .underInvestigationFirs(firRepository.countByStatus(FIRStatus.UNDER_INVESTIGATION))
                .inProgressFirs(firRepository.countByStatus(FIRStatus.IN_PROGRESS))
                .closedFirs(firRepository.countByStatus(FIRStatus.CLOSED))
                .emergencyFirs(firRepository.countByPriority(Priority.EMERGENCY))
                .totalUsers(userRepository.count())
                .policeOfficers(userRepository.findByRole(Role.POLICE).size())
                .firsByIncidentType(firsByIncidentType)
                .firsByPriority(firsByPriority)
                .firsByStatus(firsByStatus)
                .build();
    }

    private String generateFirNumber() {
        long count = firRepository.count() + 1;
        return "FIR-" + Year.now().getValue() + "-" + String.format("%04d", count);
    }

    // ✅ Updated to map history
    private FIRResponse mapToResponse(FIR fir) {
        
        // Fetch history logs
        List<FIRHistoryDTO> historyLogs = firHistoryRepository.findByFirIdOrderByTimestampDesc(fir.getId())
                .stream()
                .map(h -> FIRHistoryDTO.builder()
                        .id(h.getId())
                        .action(h.getAction())
                        .description(h.getDescription())
                        .officerName(h.getChangedBy() != null ? h.getChangedBy().getName() : "System")
                        .timestamp(h.getTimestamp())
                        .build())
                .collect(Collectors.toList());

        return FIRResponse.builder()
                .id(fir.getId())
                .firNumber(fir.getFirNumber())
                .complainantName(fir.getComplainantName())
                .complainantEmail(fir.getComplainantEmail())
                .incidentType(fir.getIncidentType())
                .description(fir.getDescription())
                .dateTime(fir.getDateTime())
                .priority(fir.getPriority())
                .location(fir.getLocation())
                .status(fir.getStatus())
                .assignedStation(fir.getAssignedStation())
                .assignedOfficer(fir.getAssignedOfficer())
                .remarks(fir.getRemarks())
                .actionNotes(fir.getActionNotes())
                .evidenceFiles(fir.getEvidenceFiles())
                .createdAt(fir.getCreatedAt())
                .updatedAt(fir.getUpdatedAt())
                .history(historyLogs) // ✅ Add history list to response
                .build();
    }
}
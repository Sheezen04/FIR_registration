package com.example.Backend.controller;

import com.example.Backend.dto.*;
import com.example.Backend.entity.FIRStatus;
import com.example.Backend.entity.User;
import com.example.Backend.service.FIRService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fir")
@RequiredArgsConstructor
@CrossOrigin
public class FIRController {

    private final FIRService firService;

    @PostMapping
    @PreAuthorize("hasRole('CITIZEN') or hasRole('POLICE') or hasRole('ADMIN')")
    public ResponseEntity<FIRResponse> createFIR(
            @RequestBody FIRRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(firService.createFIR(request, user));
    }

    @GetMapping
    @PreAuthorize("hasRole('POLICE') or hasRole('ADMIN')")
    public ResponseEntity<List<FIRResponse>> getAllFIRs() {
        return ResponseEntity.ok(firService.getAllFIRs());
    }

    @GetMapping("/paginated")
    @PreAuthorize("hasRole('POLICE') or hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<FIRResponse>> getPaginatedFIRs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String complainant,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String incidentType,
            @RequestParam(required = false) String dateFilter
    ) {
        return ResponseEntity.ok(firService.getPaginatedFIRs(
                page, size, search, complainant, status, priority, incidentType, dateFilter
        ));
    }

    @GetMapping("/my")
    public ResponseEntity<List<FIRResponse>> getMyFIRs(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(firService.getFIRsByUser(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FIRResponse> getFIRById(@PathVariable Long id) {
        return ResponseEntity.ok(firService.getFIRById(id));
    }

    @GetMapping("/number/{firNumber}")
    public ResponseEntity<FIRResponse> getFIRByNumber(@PathVariable String firNumber) {
        return ResponseEntity.ok(firService.getFIRByNumber(firNumber));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('POLICE') or hasRole('ADMIN')")
    public ResponseEntity<List<FIRResponse>> getFIRsByStatus(@PathVariable FIRStatus status) {
        return ResponseEntity.ok(firService.getFIRsByStatus(status));
    }

    @GetMapping("/officer/{officerId}")
    @PreAuthorize("hasRole('POLICE') or hasRole('ADMIN')")
    public ResponseEntity<List<FIRResponse>> getFIRsByOfficer(@PathVariable Long officerId) {
        return ResponseEntity.ok(firService.getFIRsByOfficer(officerId));
    }

    @GetMapping("/station/{station}")
    @PreAuthorize("hasRole('POLICE') or hasRole('ADMIN')")
    public ResponseEntity<List<FIRResponse>> getFIRsByStation(@PathVariable String station) {
        return ResponseEntity.ok(firService.getFIRsByStation(station));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('POLICE') or hasRole('ADMIN')")
    public ResponseEntity<FIRResponse> updateFIRStatus(
            @PathVariable Long id,
            @RequestBody UpdateFIRStatusRequest request
    ) {
        return ResponseEntity.ok(firService.updateFIRStatus(id, request));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardStats> getDashboardStats() {
        return ResponseEntity.ok(firService.getDashboardStats());
    }
}

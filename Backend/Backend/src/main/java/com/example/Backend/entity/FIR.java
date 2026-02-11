package com.example.Backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "firs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FIR {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fir_number", unique = true, nullable = false)
    private String firNumber;

    @Column(name = "complainant_name", nullable = false)
    private String complainantName;

    @Column(name = "complainant_email", nullable = false)
    private String complainantEmail;

    @Column(name = "incident_type", nullable = false)
    private String incidentType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "date_time", nullable = false)
    private LocalDateTime dateTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority = Priority.MEDIUM;

    @Column(nullable = false)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FIRStatus status = FIRStatus.PENDING;

    @Column(name = "assigned_station")
    private String assignedStation;

    @Column(name = "assigned_officer")
    private String assignedOfficer;

    @Column(name = "assigned_officer_id")
    private Long assignedOfficerId;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @ElementCollection
    @CollectionTable(name = "fir_action_notes", joinColumns = @JoinColumn(name = "fir_id"))
    @Column(name = "note")
    private List<String> actionNotes = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "fir_evidence_files", joinColumns = @JoinColumn(name = "fir_id"))
    @Column(name = "file_path")
    private List<String> evidenceFiles = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (firNumber == null) {
            firNumber = generateFirNumber();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    private String generateFirNumber() {
        return "FIR-" + java.time.Year.now().getValue() + "-" + String.format("%04d", System.currentTimeMillis() % 10000);
    }
}

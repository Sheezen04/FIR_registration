package com.example.Backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FIRHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fir_id", nullable = false)
    private FIR fir;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_user_id")
    private User changedBy; // The Police Officer/Admin who performed the action

    private String action; // e.g., "STATUS_CHANGE", "COMMENT", "UPDATE"

    private String description; // e.g., "Changed status from PENDING to APPROVED"

    @CreationTimestamp
    private LocalDateTime timestamp;
}
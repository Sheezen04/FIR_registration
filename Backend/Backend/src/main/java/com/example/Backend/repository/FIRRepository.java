package com.example.Backend.repository;

import com.example.Backend.entity.FIR;
import com.example.Backend.entity.FIRStatus;
import com.example.Backend.entity.Priority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FIRRepository extends JpaRepository<FIR, Long>, JpaSpecificationExecutor<FIR> {
    Optional<FIR> findByFirNumber(String firNumber);
    List<FIR> findByComplainantEmail(String email);
    List<FIR> findByUserId(Long userId);
    List<FIR> findByStatus(FIRStatus status);
    List<FIR> findByPriority(Priority priority);
    List<FIR> findByAssignedOfficerId(Long officerId);
    List<FIR> findByAssignedStation(String station);
    
    @Query("SELECT COUNT(f) FROM FIR f WHERE f.status = :status")
    long countByStatus(@Param("status") FIRStatus status);
    
    @Query("SELECT COUNT(f) FROM FIR f WHERE f.priority = :priority")
    long countByPriority(@Param("priority") Priority priority);
    
    @Query("SELECT f.incidentType, COUNT(f) FROM FIR f GROUP BY f.incidentType")
    List<Object[]> countByIncidentType();
}

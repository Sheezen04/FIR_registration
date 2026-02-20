package com.example.Backend.repository;

import com.example.Backend.entity.FIRHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FIRHistoryRepository extends JpaRepository<FIRHistory, Long> {
    List<FIRHistory> findByFirIdOrderByTimestampDesc(Long firId);
}
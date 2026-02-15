package com.example.Backend.specification;

import com.example.Backend.entity.FIR;
import com.example.Backend.entity.FIRStatus;
import com.example.Backend.entity.Priority;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class FIRSpecification {

    public static Specification<FIR> withFilters(
            String search,
            String complainant,
            String status,
            String priority,
            String incidentType,
            String dateFilter
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Search across multiple fields (FIR number, description, location)
            if (search != null && !search.trim().isEmpty()) {
                String searchLower = "%" + search.toLowerCase().trim() + "%";
                Predicate firNumberMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("firNumber")), searchLower);
                Predicate descriptionMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("description")), searchLower);
                Predicate locationMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("location")), searchLower);
                predicates.add(criteriaBuilder.or(firNumberMatch, descriptionMatch, locationMatch));
            }

            // Complainant name filter
            if (complainant != null && !complainant.trim().isEmpty()) {
                String complainantLower = "%" + complainant.toLowerCase().trim() + "%";
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("complainantName")), complainantLower));
            }

            // Status filter
            if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
                try {
                    FIRStatus firStatus = FIRStatus.valueOf(status.toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("status"), firStatus));
                } catch (IllegalArgumentException ignored) {
                    // Invalid status, skip filter
                }
            }

            // Priority filter
            if (priority != null && !priority.trim().isEmpty() && !priority.equalsIgnoreCase("ALL")) {
                try {
                    Priority firPriority = Priority.valueOf(priority.toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("priority"), firPriority));
                } catch (IllegalArgumentException ignored) {
                    // Invalid priority, skip filter
                }
            }

            // Incident type filter
            if (incidentType != null && !incidentType.trim().isEmpty() && !incidentType.equalsIgnoreCase("ALL")) {
                predicates.add(criteriaBuilder.equal(root.get("incidentType"), incidentType));
            }

            // Date filter (exact date match on createdAt)
            if (dateFilter != null && !dateFilter.trim().isEmpty()) {
                try {
                    java.time.LocalDate date = java.time.LocalDate.parse(dateFilter);
                    java.time.LocalDateTime startOfDay = date.atStartOfDay();
                    java.time.LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startOfDay));
                    predicates.add(criteriaBuilder.lessThan(root.get("createdAt"), endOfDay));
                } catch (Exception ignored) {
                    // Invalid date format, skip filter
                }
            }

            // Default ordering by createdAt descending
            query.orderBy(criteriaBuilder.desc(root.get("createdAt")));

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}

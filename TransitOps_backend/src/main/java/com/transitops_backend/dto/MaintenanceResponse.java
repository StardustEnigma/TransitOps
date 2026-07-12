package com.transitops_backend.dto;

import com.transitops_backend.enums.MaintenanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceResponse {

    private Long id;
    private Long vehicleId;
    private String vehicleRegistration;
    private String title;
    private String description;
    private LocalDate maintenanceDate;
    private BigDecimal cost;
    private MaintenanceStatus status;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

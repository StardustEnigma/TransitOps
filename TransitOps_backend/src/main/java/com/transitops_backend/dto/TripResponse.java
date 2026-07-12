package com.transitops_backend.dto;

import com.transitops_backend.enums.TripStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripResponse {

    private Long id;
    private Long vehicleId;
    private String vehicleRegistration;
    private Long driverId;
    private String driverName;
    private String source;
    private String destination;
    private BigDecimal cargoWeight;
    private BigDecimal plannedDistance;
    private BigDecimal actualDistance;
    private TripStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

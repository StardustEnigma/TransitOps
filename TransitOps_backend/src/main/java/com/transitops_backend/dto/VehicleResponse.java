package com.transitops_backend.dto;

import com.transitops_backend.enums.VehicleStatus;
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
public class VehicleResponse {

    private Long id;
    private String registrationNumber;
    private String modelName;
    private String type;
    private BigDecimal maxLoadCapacity;
    private BigDecimal odometer;
    private BigDecimal acquisitionCost;
    private VehicleStatus status;
    private Long version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

package com.transitops_backend.dto;

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
public class FuelLogResponse {

    private Long id;
    private Long vehicleId;
    private String vehicleRegistration;
    private Long tripId;
    private BigDecimal liters;
    private BigDecimal cost;
    private BigDecimal odometer;
    private LocalDate fuelDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

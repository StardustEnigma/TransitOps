package com.transitops_backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FuelLogRequest {

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    private Long tripId;

    @NotNull(message = "Liters is required")
    @Positive(message = "Liters must be positive")
    private BigDecimal liters;

    @PositiveOrZero(message = "Cost must be zero or positive")
    private BigDecimal cost;

    @PositiveOrZero(message = "Odometer must be zero or positive")
    private BigDecimal odometer;

    @NotNull(message = "Fuel date is required")
    private LocalDate fuelDate;
}

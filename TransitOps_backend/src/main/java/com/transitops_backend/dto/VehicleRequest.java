package com.transitops_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleRequest {

    @NotBlank(message = "Registration number is required")
    private String registrationNumber;

    @NotBlank(message = "Model name is required")
    private String modelName;

    private String type;

    @PositiveOrZero(message = "Max load capacity must be zero or positive")
    private BigDecimal maxLoadCapacity;

    @PositiveOrZero(message = "Odometer must be zero or positive")
    private BigDecimal odometer;

    @PositiveOrZero(message = "Acquisition cost must be zero or positive")
    private BigDecimal acquisitionCost;
}

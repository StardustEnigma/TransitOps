package com.transitops_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationalCostReport {

    private Long vehicleId;
    private String registrationNumber;
    private String modelName;
    private BigDecimal fuelCost;
    private BigDecimal maintenanceCost;
    private BigDecimal otherExpenses;
    private BigDecimal totalOperationalCost;
}

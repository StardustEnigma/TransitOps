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
public class RoiReport {

    private Long vehicleId;
    private String registrationNumber;
    private String modelName;
    private BigDecimal revenue;
    private BigDecimal totalExpenses; // fuel + maintenance + other
    private BigDecimal acquisitionCost;
    private BigDecimal roi; // (revenue - expenses) / acquisitionCost
}

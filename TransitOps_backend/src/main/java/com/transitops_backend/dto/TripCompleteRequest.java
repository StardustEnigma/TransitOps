package com.transitops_backend.dto;

import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TripCompleteRequest {

    @PositiveOrZero(message = "Actual distance must be zero or positive")
    private BigDecimal actualDistance;
}

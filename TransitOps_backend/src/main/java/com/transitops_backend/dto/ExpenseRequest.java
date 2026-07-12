package com.transitops_backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseRequest {

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    private Long tripId;

    @NotNull(message = "Expense type is required")
    private String expenseType;

    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    private String description;

    @NotNull(message = "Expense date is required")
    private LocalDate expenseDate;
}

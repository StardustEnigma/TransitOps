package com.transitops_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "License number is required")
    private String licenseNumber;

    private String licenseCategory;

    private LocalDate licenseExpiry;

    private String contactNumber;

    @Min(value = 0, message = "Safety score minimum is 0")
    @Max(value = 100, message = "Safety score maximum is 100")
    private Integer safetyScore;
}

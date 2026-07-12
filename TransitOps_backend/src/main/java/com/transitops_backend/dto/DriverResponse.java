package com.transitops_backend.dto;

import com.transitops_backend.enums.DriverStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverResponse {

    private Long id;
    private String name;
    private String licenseNumber;
    private String licenseCategory;
    private LocalDate licenseExpiry;
    private String contactNumber;
    private String email;
    private Integer safetyScore;
    private DriverStatus status;
    private boolean licenseExpired;
    private Long version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

package com.transitops_backend.entity;

import com.transitops_backend.enums.DriverStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "drivers", indexes = {
        @Index(name = "idx_driver_license", columnList = "license_number", unique = true),
        @Index(name = "idx_driver_status", columnList = "status"),
        @Index(name = "idx_driver_license_expiry", columnList = "license_expiry")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank
    @Column(name = "license_number", nullable = false, unique = true, length = 30)
    private String licenseNumber;

    @Column(name = "license_category", length = 20)
    private String licenseCategory;

    @Column(name = "license_expiry")
    private LocalDate licenseExpiry;

    @Column(name = "contact_number", length = 20)
    private String contactNumber;

    @Builder.Default
    @Min(0)
    @Max(100)
    @Column(name = "safety_score")
    private Integer safetyScore = 100;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DriverStatus status = DriverStatus.AVAILABLE;

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Checks whether the driver's license has expired.
     * Used at dispatch time to block expired-license drivers.
     */
    @Transient
    public boolean isLicenseExpired() {
        return licenseExpiry != null && licenseExpiry.isBefore(LocalDate.now());
    }
}

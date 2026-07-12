package com.transitops_backend.entity;

import com.transitops_backend.enums.VehicleStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicles", indexes = {
        @Index(name = "idx_vehicle_registration", columnList = "registration_number", unique = true),
        @Index(name = "idx_vehicle_status", columnList = "status"),
        @Index(name = "idx_vehicle_type", columnList = "type")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "registration_number", nullable = false, unique = true, length = 30)
    private String registrationNumber;

    @NotBlank
    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(length = 50)
    private String type;

    @PositiveOrZero
    @Column(name = "max_load_capacity", precision = 10, scale = 2)
    private BigDecimal maxLoadCapacity;

    @PositiveOrZero
    @Column(precision = 12, scale = 2)
    private BigDecimal odometer;

    @PositiveOrZero
    @Column(name = "acquisition_cost", precision = 14, scale = 2)
    private BigDecimal acquisitionCost;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VehicleStatus status = VehicleStatus.AVAILABLE;

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

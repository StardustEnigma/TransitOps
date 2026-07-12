package com.transitops_backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fuel_logs", indexes = {
        @Index(name = "idx_fuel_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_fuel_trip", columnList = "trip_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuelLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @Positive
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal liters;

    @PositiveOrZero
    @Column(precision = 12, scale = 2)
    private BigDecimal cost;

    @PositiveOrZero
    @Column(precision = 12, scale = 2)
    private BigDecimal odometer;

    @Column(name = "fuel_date", nullable = false)
    private LocalDate fuelDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

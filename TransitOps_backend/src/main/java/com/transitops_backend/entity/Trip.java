package com.transitops_backend.entity;

import com.transitops_backend.enums.TripStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "trips", indexes = {
        @Index(name = "idx_trip_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false,
            foreignKey = @ForeignKey(foreignKeyDefinition = "FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT"))
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false,
            foreignKey = @ForeignKey(foreignKeyDefinition = "FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT"))
    private Driver driver;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String source;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String destination;

    @PositiveOrZero
    @Column(name = "cargo_weight", precision = 10, scale = 2)
    private BigDecimal cargoWeight;

    @PositiveOrZero
    @Column(name = "planned_distance", precision = 10, scale = 2)
    private BigDecimal plannedDistance;

    @PositiveOrZero
    @Column(name = "actual_distance", precision = 10, scale = 2)
    private BigDecimal actualDistance;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TripStatus status = TripStatus.DRAFT;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

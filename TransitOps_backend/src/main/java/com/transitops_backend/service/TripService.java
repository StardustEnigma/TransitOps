package com.transitops_backend.service;

import com.transitops_backend.dto.TripCompleteRequest;
import com.transitops_backend.dto.TripRequest;
import com.transitops_backend.dto.TripResponse;
import com.transitops_backend.entity.Driver;
import com.transitops_backend.entity.Trip;
import com.transitops_backend.entity.Vehicle;
import com.transitops_backend.enums.DriverStatus;
import com.transitops_backend.enums.TripStatus;
import com.transitops_backend.enums.VehicleStatus;
import com.transitops_backend.exception.BusinessRuleException;
import com.transitops_backend.exception.ResourceNotFoundException;
import com.transitops_backend.repository.DriverRepository;
import com.transitops_backend.repository.TripRepository;
import com.transitops_backend.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;

    public List<TripResponse> getAllTrips() {
        return tripRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<TripResponse> getTripsByStatus(TripStatus status) {
        return tripRepository.findByStatus(status).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TripResponse getTripById(Long id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", id));
        return toResponse(trip);
    }

    @Transactional
    public TripResponse createTrip(TripRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", request.getVehicleId()));

        Driver driver = driverRepository.findById(request.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", request.getDriverId()));

        Trip trip = Trip.builder()
                .vehicle(vehicle)
                .driver(driver)
                .source(request.getSource())
                .destination(request.getDestination())
                .cargoWeight(request.getCargoWeight())
                .plannedDistance(request.getPlannedDistance())
                .status(TripStatus.DRAFT)
                .build();

        trip = tripRepository.save(trip);
        return toResponse(trip);
    }

    @Transactional
    public TripResponse dispatchTrip(Long id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", id));

        if (trip.getStatus() != TripStatus.DRAFT) {
            throw new BusinessRuleException("Only DRAFT trips can be dispatched. Current status: " + trip.getStatus());
        }

        Vehicle vehicle = trip.getVehicle();
        Driver driver = trip.getDriver();

        // Business rule: vehicle must be AVAILABLE
        if (vehicle.getStatus() != VehicleStatus.AVAILABLE) {
            throw new BusinessRuleException("Vehicle is not available. Current status: " + vehicle.getStatus());
        }

        // Business rule: driver must be AVAILABLE
        if (driver.getStatus() != DriverStatus.AVAILABLE) {
            throw new BusinessRuleException("Driver is not available. Current status: " + driver.getStatus());
        }

        // Business rule: driver license must not be expired
        if (driver.isLicenseExpired()) {
            throw new BusinessRuleException("Driver's license has expired on: " + driver.getLicenseExpiry());
        }

        // Business rule: cargo weight must not exceed vehicle capacity
        if (trip.getCargoWeight() != null && vehicle.getMaxLoadCapacity() != null
                && trip.getCargoWeight().compareTo(vehicle.getMaxLoadCapacity()) > 0) {
            throw new BusinessRuleException(
                    String.format("Cargo weight (%.2f) exceeds vehicle max capacity (%.2f)",
                            trip.getCargoWeight(), vehicle.getMaxLoadCapacity()));
        }

        // Update statuses atomically
        trip.setStatus(TripStatus.DISPATCHED);
        trip.setStartTime(LocalDateTime.now());
        vehicle.setStatus(VehicleStatus.ON_TRIP);
        driver.setStatus(DriverStatus.ON_TRIP);

        vehicleRepository.save(vehicle);
        driverRepository.save(driver);
        trip = tripRepository.save(trip);

        return toResponse(trip);
    }

    @Transactional
    public TripResponse completeTrip(Long id, TripCompleteRequest request) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", id));

        if (trip.getStatus() != TripStatus.DISPATCHED) {
            throw new BusinessRuleException("Only DISPATCHED trips can be completed. Current status: " + trip.getStatus());
        }

        Vehicle vehicle = trip.getVehicle();
        Driver driver = trip.getDriver();

        // Restore statuses
        trip.setStatus(TripStatus.COMPLETED);
        trip.setEndTime(LocalDateTime.now());
        if (request != null && request.getActualDistance() != null) {
            trip.setActualDistance(request.getActualDistance());
        }
        vehicle.setStatus(VehicleStatus.AVAILABLE);
        driver.setStatus(DriverStatus.AVAILABLE);

        vehicleRepository.save(vehicle);
        driverRepository.save(driver);
        trip = tripRepository.save(trip);

        return toResponse(trip);
    }

    @Transactional
    public TripResponse cancelTrip(Long id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", id));

        if (trip.getStatus() != TripStatus.DRAFT && trip.getStatus() != TripStatus.DISPATCHED) {
            throw new BusinessRuleException("Only DRAFT or DISPATCHED trips can be cancelled. Current status: " + trip.getStatus());
        }

        // If dispatched, restore vehicle/driver to AVAILABLE
        if (trip.getStatus() == TripStatus.DISPATCHED) {
            Vehicle vehicle = trip.getVehicle();
            Driver driver = trip.getDriver();
            vehicle.setStatus(VehicleStatus.AVAILABLE);
            driver.setStatus(DriverStatus.AVAILABLE);
            vehicleRepository.save(vehicle);
            driverRepository.save(driver);
        }

        trip.setStatus(TripStatus.CANCELLED);
        trip.setEndTime(LocalDateTime.now());
        trip = tripRepository.save(trip);

        return toResponse(trip);
    }

    private TripResponse toResponse(Trip trip) {
        return TripResponse.builder()
                .id(trip.getId())
                .vehicleId(trip.getVehicle().getId())
                .vehicleRegistration(trip.getVehicle().getRegistrationNumber())
                .driverId(trip.getDriver().getId())
                .driverName(trip.getDriver().getName())
                .source(trip.getSource())
                .destination(trip.getDestination())
                .cargoWeight(trip.getCargoWeight())
                .plannedDistance(trip.getPlannedDistance())
                .actualDistance(trip.getActualDistance())
                .status(trip.getStatus())
                .startTime(trip.getStartTime())
                .endTime(trip.getEndTime())
                .version(trip.getVersion())
                .createdAt(trip.getCreatedAt())
                .updatedAt(trip.getUpdatedAt())
                .build();
    }
}

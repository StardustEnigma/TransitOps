package com.transitops_backend.service;

import com.transitops_backend.dto.FuelLogRequest;
import com.transitops_backend.dto.FuelLogResponse;
import com.transitops_backend.entity.FuelLog;
import com.transitops_backend.entity.Trip;
import com.transitops_backend.entity.Vehicle;
import com.transitops_backend.exception.ResourceNotFoundException;
import com.transitops_backend.repository.FuelLogRepository;
import com.transitops_backend.repository.TripRepository;
import com.transitops_backend.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FuelLogService {

    private final FuelLogRepository fuelLogRepository;
    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;

    public List<FuelLogResponse> getAllFuelLogs() {
        return fuelLogRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<FuelLogResponse> getByVehicleId(Long vehicleId) {
        return fuelLogRepository.findByVehicleId(vehicleId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public FuelLogResponse getById(Long id) {
        FuelLog log = fuelLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FuelLog", "id", id));
        return toResponse(log);
    }

    @Transactional
    public FuelLogResponse createFuelLog(FuelLogRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", request.getVehicleId()));

        Trip trip = null;
        if (request.getTripId() != null) {
            trip = tripRepository.findById(request.getTripId())
                    .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", request.getTripId()));
        }

        FuelLog log = FuelLog.builder()
                .vehicle(vehicle)
                .trip(trip)
                .liters(request.getLiters())
                .cost(request.getCost())
                .odometer(request.getOdometer())
                .fuelDate(request.getFuelDate())
                .build();

        log = fuelLogRepository.save(log);
        return toResponse(log);
    }

    private FuelLogResponse toResponse(FuelLog log) {
        return FuelLogResponse.builder()
                .id(log.getId())
                .vehicleId(log.getVehicle().getId())
                .vehicleRegistration(log.getVehicle().getRegistrationNumber())
                .tripId(log.getTrip() != null ? log.getTrip().getId() : null)
                .liters(log.getLiters())
                .cost(log.getCost())
                .odometer(log.getOdometer())
                .fuelDate(log.getFuelDate())
                .createdAt(log.getCreatedAt())
                .updatedAt(log.getUpdatedAt())
                .build();
    }
}

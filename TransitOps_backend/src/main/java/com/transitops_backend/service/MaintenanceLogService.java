package com.transitops_backend.service;

import com.transitops_backend.dto.MaintenanceRequest;
import com.transitops_backend.dto.MaintenanceResponse;
import com.transitops_backend.entity.MaintenanceLog;
import com.transitops_backend.entity.Vehicle;
import com.transitops_backend.enums.MaintenanceStatus;
import com.transitops_backend.enums.VehicleStatus;
import com.transitops_backend.exception.BusinessRuleException;
import com.transitops_backend.exception.ResourceNotFoundException;
import com.transitops_backend.repository.MaintenanceLogRepository;
import com.transitops_backend.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaintenanceLogService {

    private final MaintenanceLogRepository maintenanceLogRepository;
    private final VehicleRepository vehicleRepository;

    public List<MaintenanceResponse> getAllMaintenanceLogs() {
        return maintenanceLogRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<MaintenanceResponse> getByVehicleId(Long vehicleId) {
        return maintenanceLogRepository.findByVehicleId(vehicleId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public MaintenanceResponse getById(Long id) {
        MaintenanceLog log = maintenanceLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MaintenanceLog", "id", id));
        return toResponse(log);
    }

    @Transactional
    public MaintenanceResponse createMaintenanceLog(MaintenanceRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", request.getVehicleId()));

        if (vehicle.getStatus() == VehicleStatus.ON_TRIP) {
            throw new BusinessRuleException("Cannot create maintenance for a vehicle currently on a trip");
        }

        if (!maintenanceLogRepository.findByVehicleIdAndStatus(vehicle.getId(), MaintenanceStatus.OPEN).isEmpty()) {
            throw new BusinessRuleException("Vehicle already has an open maintenance log");
        }

        // Set vehicle to IN_SHOP
        vehicle.setStatus(VehicleStatus.IN_SHOP);
        vehicleRepository.save(vehicle);

        MaintenanceLog log = MaintenanceLog.builder()
                .vehicle(vehicle)
                .title(request.getTitle())
                .description(request.getDescription())
                .maintenanceDate(request.getMaintenanceDate())
                .cost(request.getCost())
                .status(MaintenanceStatus.OPEN)
                .build();

        log = maintenanceLogRepository.save(log);
        return toResponse(log);
    }

    @Transactional
    public MaintenanceResponse closeMaintenanceLog(Long id) {
        MaintenanceLog log = maintenanceLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MaintenanceLog", "id", id));

        if (log.getStatus() != MaintenanceStatus.OPEN) {
            throw new BusinessRuleException("Only OPEN maintenance logs can be closed. Current status: " + log.getStatus());
        }

        log.setStatus(MaintenanceStatus.COMPLETED);
        log.setCompletedAt(LocalDateTime.now());
        log = maintenanceLogRepository.save(log);

        // Restore vehicle to AVAILABLE unless RETIRED or another maintenance log is still OPEN
        Vehicle vehicle = log.getVehicle();
        boolean hasOtherOpenLogs = !maintenanceLogRepository
                .findByVehicleIdAndStatus(vehicle.getId(), MaintenanceStatus.OPEN).isEmpty();
        if (vehicle.getStatus() != VehicleStatus.RETIRED && !hasOtherOpenLogs) {
            vehicle.setStatus(VehicleStatus.AVAILABLE);
            vehicleRepository.save(vehicle);
        }
        return toResponse(log);
    }

    private MaintenanceResponse toResponse(MaintenanceLog log) {
        return MaintenanceResponse.builder()
                .id(log.getId())
                .vehicleId(log.getVehicle().getId())
                .vehicleRegistration(log.getVehicle().getRegistrationNumber())
                .title(log.getTitle())
                .description(log.getDescription())
                .maintenanceDate(log.getMaintenanceDate())
                .cost(log.getCost())
                .status(log.getStatus())
                .completedAt(log.getCompletedAt())
                .createdAt(log.getCreatedAt())
                .updatedAt(log.getUpdatedAt())
                .build();
    }
}

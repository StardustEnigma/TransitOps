package com.transitops_backend.controller;

import com.transitops_backend.dto.MaintenanceRequest;
import com.transitops_backend.dto.MaintenanceResponse;
import com.transitops_backend.service.MaintenanceLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceLogController {

    private final MaintenanceLogService maintenanceLogService;

    @GetMapping
    public ResponseEntity<List<MaintenanceResponse>> getAll(
            @RequestParam(required = false) Long vehicleId) {
        List<MaintenanceResponse> logs = (vehicleId != null)
                ? maintenanceLogService.getByVehicleId(vehicleId)
                : maintenanceLogService.getAllMaintenanceLogs();
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceLogService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('FLEET_MANAGER')")
    public ResponseEntity<MaintenanceResponse> create(@Valid @RequestBody MaintenanceRequest request) {
        MaintenanceResponse response = maintenanceLogService.createMaintenanceLog(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('FLEET_MANAGER')")
    public ResponseEntity<MaintenanceResponse> close(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceLogService.closeMaintenanceLog(id));
    }
}

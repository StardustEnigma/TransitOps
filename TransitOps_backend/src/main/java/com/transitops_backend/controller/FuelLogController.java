package com.transitops_backend.controller;

import com.transitops_backend.dto.FuelLogRequest;
import com.transitops_backend.dto.FuelLogResponse;
import com.transitops_backend.service.FuelLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fuel-logs")
@RequiredArgsConstructor
public class FuelLogController {

    private final FuelLogService fuelLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<List<FuelLogResponse>> getAll(
            @RequestParam(required = false) Long vehicleId) {
        List<FuelLogResponse> logs = (vehicleId != null)
                ? fuelLogService.getByVehicleId(vehicleId)
                : fuelLogService.getAllFuelLogs();
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<FuelLogResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(fuelLogService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('FLEET_MANAGER')")
    public ResponseEntity<FuelLogResponse> create(@Valid @RequestBody FuelLogRequest request) {
        FuelLogResponse response = fuelLogService.createFuelLog(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

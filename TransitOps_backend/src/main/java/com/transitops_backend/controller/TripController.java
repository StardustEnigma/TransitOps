package com.transitops_backend.controller;

import com.transitops_backend.dto.TripCompleteRequest;
import com.transitops_backend.dto.TripRequest;
import com.transitops_backend.dto.TripResponse;
import com.transitops_backend.enums.TripStatus;
import com.transitops_backend.service.TripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @GetMapping
    public ResponseEntity<List<TripResponse>> getAllTrips(
            @RequestParam(required = false) TripStatus status) {
        List<TripResponse> trips = (status != null)
                ? tripService.getTripsByStatus(status)
                : tripService.getAllTrips();
        return ResponseEntity.ok(trips);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripResponse> getTripById(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTripById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DRIVER', 'FLEET_MANAGER')")
    public ResponseEntity<TripResponse> createTrip(@Valid @RequestBody TripRequest request) {
        TripResponse response = tripService.createTrip(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/dispatch")
    @PreAuthorize("hasAnyRole('DRIVER', 'FLEET_MANAGER')")
    public ResponseEntity<TripResponse> dispatchTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.dispatchTrip(id));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('DRIVER', 'FLEET_MANAGER')")
    public ResponseEntity<TripResponse> completeTrip(
            @PathVariable Long id, @Valid @RequestBody(required = false) TripCompleteRequest request) {
        return ResponseEntity.ok(tripService.completeTrip(id, request));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('DRIVER', 'FLEET_MANAGER')")
    public ResponseEntity<TripResponse> cancelTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.cancelTrip(id));
    }
}

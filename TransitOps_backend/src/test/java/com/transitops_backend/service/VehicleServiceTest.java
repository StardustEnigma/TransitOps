package com.transitops_backend.service;

import com.transitops_backend.dto.VehicleRequest;
import com.transitops_backend.dto.VehicleResponse;
import com.transitops_backend.entity.Vehicle;
import com.transitops_backend.enums.VehicleStatus;
import com.transitops_backend.exception.BusinessRuleException;
import com.transitops_backend.exception.ResourceNotFoundException;
import com.transitops_backend.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VehicleServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @InjectMocks
    private VehicleService vehicleService;

    private Vehicle testVehicle;
    private VehicleRequest testRequest;

    @BeforeEach
    void setUp() {
        testVehicle = Vehicle.builder()
                .id(1L)
                .registrationNumber("VAN-005")
                .modelName("Ford Transit")
                .type("Cargo Van")
                .maxLoadCapacity(BigDecimal.valueOf(1500.00))
                .odometer(BigDecimal.valueOf(10000))
                .acquisitionCost(BigDecimal.valueOf(40000))
                .status(VehicleStatus.AVAILABLE)
                .build();

        testRequest = new VehicleRequest(
                "VAN-005",
                "Ford Transit",
                "Cargo Van",
                BigDecimal.valueOf(1500.00),
                BigDecimal.valueOf(10000),
                BigDecimal.valueOf(40000)
        );
    }

    @Test
    void getAllVehicles_Success() {
        when(vehicleRepository.findAll()).thenReturn(Collections.singletonList(testVehicle));

        List<VehicleResponse> list = vehicleService.getAllVehicles();

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("VAN-005", list.get(0).getRegistrationNumber());
    }

    @Test
    void getVehicleById_Success() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(testVehicle));

        VehicleResponse response = vehicleService.getVehicleById(1L);

        assertNotNull(response);
        assertEquals("VAN-005", response.getRegistrationNumber());
    }

    @Test
    void getVehicleById_ThrowsException_WhenNotFound() {
        when(vehicleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> vehicleService.getVehicleById(99L));
    }

    @Test
    void createVehicle_Success() {
        when(vehicleRepository.existsByRegistrationNumber("VAN-005")).thenReturn(false);
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(testVehicle);

        VehicleResponse response = vehicleService.createVehicle(testRequest);

        assertNotNull(response);
        assertEquals("VAN-005", response.getRegistrationNumber());
        assertEquals(VehicleStatus.AVAILABLE, response.getStatus());

        verify(vehicleRepository).save(any(Vehicle.class));
    }

    @Test
    void createVehicle_ThrowsException_WhenRegNumberExists() {
        when(vehicleRepository.existsByRegistrationNumber("VAN-005")).thenReturn(true);

        assertThrows(BusinessRuleException.class, () -> vehicleService.createVehicle(testRequest));
        verify(vehicleRepository, never()).save(any(Vehicle.class));
    }

    @Test
    void updateVehicle_Success() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(testVehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(testVehicle);

        VehicleResponse response = vehicleService.updateVehicle(1L, testRequest);

        assertNotNull(response);
        verify(vehicleRepository).save(any(Vehicle.class));
    }

    @Test
    void deleteVehicle_Success() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(testVehicle));

        vehicleService.deleteVehicle(1L);

        verify(vehicleRepository).delete(testVehicle);
    }

    @Test
    void deleteVehicle_ThrowsException_WhenVehicleOnTrip() {
        testVehicle.setStatus(VehicleStatus.ON_TRIP);
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(testVehicle));

        assertThrows(BusinessRuleException.class, () -> vehicleService.deleteVehicle(1L));
        verify(vehicleRepository, never()).delete(any(Vehicle.class));
    }
}

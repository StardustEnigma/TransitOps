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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TripServiceTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private DriverRepository driverRepository;

    @InjectMocks
    private TripService tripService;

    private Vehicle testVehicle;
    private Driver testDriver;
    private Trip testTrip;

    @BeforeEach
    void setUp() {
        testVehicle = Vehicle.builder()
                .id(1L)
                .registrationNumber("VAN-005")
                .status(VehicleStatus.AVAILABLE)
                .maxLoadCapacity(BigDecimal.valueOf(1500))
                .build();

        testDriver = Driver.builder()
                .id(1L)
                .name("John Doe")
                .licenseExpiry(LocalDate.now().plusYears(1))
                .status(DriverStatus.AVAILABLE)
                .build();

        testTrip = Trip.builder()
                .id(1L)
                .vehicle(testVehicle)
                .driver(testDriver)
                .source("Warehouse")
                .destination("Store")
                .cargoWeight(BigDecimal.valueOf(1000))
                .status(TripStatus.DRAFT)
                .build();
    }

    @Test
    void createTrip_Success() {
        TripRequest request = new TripRequest(1L, 1L, "Warehouse", "Store", BigDecimal.valueOf(1000), BigDecimal.valueOf(100));

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(testVehicle));
        when(driverRepository.findById(1L)).thenReturn(Optional.of(testDriver));
        when(tripRepository.save(any(Trip.class))).thenReturn(testTrip);

        TripResponse response = tripService.createTrip(request);

        assertNotNull(response);
        assertEquals(TripStatus.DRAFT, response.getStatus());
        verify(tripRepository).save(any(Trip.class));
    }

    @Test
    void dispatchTrip_Success() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripRepository.save(any(Trip.class))).thenReturn(testTrip);

        TripResponse response = tripService.dispatchTrip(1L);

        assertNotNull(response);
        assertEquals(TripStatus.DISPATCHED, response.getStatus());
        assertEquals(VehicleStatus.ON_TRIP, testVehicle.getStatus());
        assertEquals(DriverStatus.ON_TRIP, testDriver.getStatus());

        verify(vehicleRepository).save(testVehicle);
        verify(driverRepository).save(testDriver);
        verify(tripRepository).save(testTrip);
    }

    @Test
    void dispatchTrip_ThrowsException_WhenVehicleNotAvailable() {
        testVehicle.setStatus(VehicleStatus.ON_TRIP);
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));

        assertThrows(BusinessRuleException.class, () -> tripService.dispatchTrip(1L));
        verify(tripRepository, never()).save(any(Trip.class));
    }

    @Test
    void dispatchTrip_ThrowsException_WhenDriverNotAvailable() {
        testDriver.setStatus(DriverStatus.OFF_DUTY);
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));

        assertThrows(BusinessRuleException.class, () -> tripService.dispatchTrip(1L));
    }

    @Test
    void dispatchTrip_ThrowsException_WhenDriverLicenseExpired() {
        testDriver.setLicenseExpiry(LocalDate.now().minusDays(1));
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));

        assertThrows(BusinessRuleException.class, () -> tripService.dispatchTrip(1L));
    }

    @Test
    void dispatchTrip_ThrowsException_WhenCargoExceedsCapacity() {
        testTrip.setCargoWeight(BigDecimal.valueOf(2000)); // vehicle capacity is 1500
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));

        assertThrows(BusinessRuleException.class, () -> tripService.dispatchTrip(1L));
    }

    @Test
    void completeTrip_Success() {
        testTrip.setStatus(TripStatus.DISPATCHED);
        testVehicle.setStatus(VehicleStatus.ON_TRIP);
        testDriver.setStatus(DriverStatus.ON_TRIP);

        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripRepository.save(any(Trip.class))).thenReturn(testTrip);

        TripCompleteRequest request = new TripCompleteRequest(BigDecimal.valueOf(110));
        TripResponse response = tripService.completeTrip(1L, request);

        assertNotNull(response);
        assertEquals(TripStatus.COMPLETED, response.getStatus());
        assertEquals(VehicleStatus.AVAILABLE, testVehicle.getStatus());
        assertEquals(DriverStatus.AVAILABLE, testDriver.getStatus());
    }

    @Test
    void cancelTrip_Success_FromDraft() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripRepository.save(any(Trip.class))).thenReturn(testTrip);

        TripResponse response = tripService.cancelTrip(1L);

        assertNotNull(response);
        assertEquals(TripStatus.CANCELLED, response.getStatus());
        assertEquals(VehicleStatus.AVAILABLE, testVehicle.getStatus());
        assertEquals(DriverStatus.AVAILABLE, testDriver.getStatus());

        verify(vehicleRepository, never()).save(any(Vehicle.class));
    }

    @Test
    void cancelTrip_Success_FromDispatched() {
        testTrip.setStatus(TripStatus.DISPATCHED);
        testVehicle.setStatus(VehicleStatus.ON_TRIP);
        testDriver.setStatus(DriverStatus.ON_TRIP);

        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripRepository.save(any(Trip.class))).thenReturn(testTrip);

        TripResponse response = tripService.cancelTrip(1L);

        assertNotNull(response);
        assertEquals(TripStatus.CANCELLED, response.getStatus());
        assertEquals(VehicleStatus.AVAILABLE, testVehicle.getStatus());
        assertEquals(DriverStatus.AVAILABLE, testDriver.getStatus());

        verify(vehicleRepository).save(testVehicle);
        verify(driverRepository).save(testDriver);
    }
}

package com.transitops_backend.service;

import com.transitops_backend.dto.DriverRequest;
import com.transitops_backend.dto.DriverResponse;
import com.transitops_backend.entity.Driver;
import com.transitops_backend.enums.DriverStatus;
import com.transitops_backend.exception.BusinessRuleException;
import com.transitops_backend.exception.ResourceNotFoundException;
import com.transitops_backend.repository.DriverRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DriverServiceTest {

    @Mock
    private DriverRepository driverRepository;

    @InjectMocks
    private DriverService driverService;

    private Driver testDriver;
    private DriverRequest testRequest;

    @BeforeEach
    void setUp() {
        testDriver = Driver.builder()
                .id(1L)
                .name("John Doe")
                .licenseNumber("DL-99887766")
                .licenseCategory("Class A")
                .licenseExpiry(LocalDate.now().plusYears(2))
                .contactNumber("+15550199")
                .safetyScore(95)
                .status(DriverStatus.AVAILABLE)
                .build();

        testRequest = new DriverRequest(
                "John Doe",
                "DL-99887766",
                "Class A",
                LocalDate.now().plusYears(2),
                "+15550199",
                95
        );
    }

    @Test
    void getAllDrivers_Success() {
        when(driverRepository.findAll()).thenReturn(Collections.singletonList(testDriver));

        List<DriverResponse> list = driverService.getAllDrivers();

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("DL-99887766", list.get(0).getLicenseNumber());
    }

    @Test
    void getDriverById_Success() {
        when(driverRepository.findById(1L)).thenReturn(Optional.of(testDriver));

        DriverResponse response = driverService.getDriverById(1L);

        assertNotNull(response);
        assertEquals("DL-99887766", response.getLicenseNumber());
    }

    @Test
    void getDriverById_ThrowsException_WhenNotFound() {
        when(driverRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> driverService.getDriverById(99L));
    }

    @Test
    void createDriver_Success() {
        when(driverRepository.existsByLicenseNumber("DL-99887766")).thenReturn(false);
        when(driverRepository.save(any(Driver.class))).thenReturn(testDriver);

        DriverResponse response = driverService.createDriver(testRequest);

        assertNotNull(response);
        assertEquals("DL-99887766", response.getLicenseNumber());
        assertEquals(DriverStatus.AVAILABLE, response.getStatus());

        verify(driverRepository).save(any(Driver.class));
    }

    @Test
    void createDriver_ThrowsException_WhenLicenseExists() {
        when(driverRepository.existsByLicenseNumber("DL-99887766")).thenReturn(true);

        assertThrows(BusinessRuleException.class, () -> driverService.createDriver(testRequest));
        verify(driverRepository, never()).save(any(Driver.class));
    }

    @Test
    void deleteDriver_Success() {
        when(driverRepository.findById(1L)).thenReturn(Optional.of(testDriver));

        driverService.deleteDriver(1L);

        verify(driverRepository).delete(testDriver);
    }

    @Test
    void deleteDriver_ThrowsException_WhenDriverOnTrip() {
        testDriver.setStatus(DriverStatus.ON_TRIP);
        when(driverRepository.findById(1L)).thenReturn(Optional.of(testDriver));

        assertThrows(BusinessRuleException.class, () -> driverService.deleteDriver(1L));
        verify(driverRepository, never()).delete(any(Driver.class));
    }
}

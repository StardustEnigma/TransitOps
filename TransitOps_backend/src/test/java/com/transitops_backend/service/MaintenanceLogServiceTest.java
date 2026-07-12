package com.transitops_backend.service;

import com.transitops_backend.dto.MaintenanceRequest;
import com.transitops_backend.dto.MaintenanceResponse;
import com.transitops_backend.entity.MaintenanceLog;
import com.transitops_backend.entity.Vehicle;
import com.transitops_backend.enums.MaintenanceStatus;
import com.transitops_backend.enums.VehicleStatus;
import com.transitops_backend.exception.BusinessRuleException;
import com.transitops_backend.repository.MaintenanceLogRepository;
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
public class MaintenanceLogServiceTest {

    @Mock
    private MaintenanceLogRepository maintenanceLogRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @InjectMocks
    private MaintenanceLogService maintenanceLogService;

    private Vehicle testVehicle;
    private MaintenanceLog testLog;

    @BeforeEach
    void setUp() {
        testVehicle = Vehicle.builder()
                .id(1L)
                .registrationNumber("VAN-005")
                .status(VehicleStatus.AVAILABLE)
                .build();

        testLog = MaintenanceLog.builder()
                .id(1L)
                .vehicle(testVehicle)
                .title("Oil Change")
                .status(MaintenanceStatus.OPEN)
                .cost(BigDecimal.valueOf(100))
                .build();
    }

    @Test
    void createMaintenanceLog_Success() {
        MaintenanceRequest request = new MaintenanceRequest(1L, "Oil Change", "Engine check", LocalDate.now(), BigDecimal.valueOf(100));

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(testVehicle));
        when(maintenanceLogRepository.save(any(MaintenanceLog.class))).thenReturn(testLog);

        MaintenanceResponse response = maintenanceLogService.createMaintenanceLog(request);

        assertNotNull(response);
        assertEquals(MaintenanceStatus.OPEN, response.getStatus());
        assertEquals(VehicleStatus.IN_SHOP, testVehicle.getStatus());

        verify(vehicleRepository).save(testVehicle);
        verify(maintenanceLogRepository).save(any(MaintenanceLog.class));
    }

    @Test
    void createMaintenanceLog_ThrowsException_WhenVehicleOnTrip() {
        testVehicle.setStatus(VehicleStatus.ON_TRIP);
        MaintenanceRequest request = new MaintenanceRequest(1L, "Oil Change", "Engine check", LocalDate.now(), BigDecimal.valueOf(100));

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(testVehicle));

        assertThrows(BusinessRuleException.class, () -> maintenanceLogService.createMaintenanceLog(request));
        verify(maintenanceLogRepository, never()).save(any(MaintenanceLog.class));
    }

    @Test
    void closeMaintenanceLog_Success() {
        testVehicle.setStatus(VehicleStatus.IN_SHOP);
        when(maintenanceLogRepository.findById(1L)).thenReturn(Optional.of(testLog));
        when(maintenanceLogRepository.save(any(MaintenanceLog.class))).thenReturn(testLog);

        MaintenanceResponse response = maintenanceLogService.closeMaintenanceLog(1L);

        assertNotNull(response);
        assertEquals(MaintenanceStatus.COMPLETED, response.getStatus());
        assertEquals(VehicleStatus.AVAILABLE, testVehicle.getStatus());

        verify(vehicleRepository).save(testVehicle);
        verify(maintenanceLogRepository).save(testLog);
    }
}

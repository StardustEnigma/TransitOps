package com.transitops_backend.service;

import com.transitops_backend.dto.DashboardKpiResponse;
import com.transitops_backend.dto.FuelEfficiencyReport;
import com.transitops_backend.dto.OperationalCostReport;
import com.transitops_backend.dto.RoiReport;
import com.transitops_backend.entity.FuelLog;
import com.transitops_backend.entity.Trip;
import com.transitops_backend.entity.Vehicle;
import com.transitops_backend.enums.TripStatus;
import com.transitops_backend.enums.VehicleStatus;
import com.transitops_backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReportServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private DriverRepository driverRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private MaintenanceLogRepository maintenanceLogRepository;

    @Mock
    private FuelLogRepository fuelLogRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @InjectMocks
    private ReportService reportService;

    private Vehicle testVehicle;
    private Trip testTrip;
    private FuelLog testFuelLog;

    @BeforeEach
    void setUp() {
        testVehicle = Vehicle.builder()
                .id(1L)
                .registrationNumber("VAN-005")
                .modelName("Ford Transit")
                .acquisitionCost(BigDecimal.valueOf(40000))
                .status(VehicleStatus.AVAILABLE)
                .build();

        testTrip = Trip.builder()
                .id(1L)
                .vehicle(testVehicle)
                .actualDistance(BigDecimal.valueOf(100))
                .status(TripStatus.COMPLETED)
                .build();

        testFuelLog = FuelLog.builder()
                .id(1L)
                .vehicle(testVehicle)
                .liters(BigDecimal.valueOf(10))
                .cost(BigDecimal.valueOf(15))
                .build();
    }

    @Test
    void getDashboardKpis_Success() {
        when(vehicleRepository.findByStatus(VehicleStatus.ON_TRIP)).thenReturn(Collections.emptyList());
        when(vehicleRepository.findByStatus(VehicleStatus.AVAILABLE)).thenReturn(Collections.singletonList(testVehicle));
        when(vehicleRepository.findByStatus(VehicleStatus.IN_SHOP)).thenReturn(Collections.emptyList());
        when(tripRepository.findByStatus(TripStatus.DISPATCHED)).thenReturn(Collections.emptyList());
        when(tripRepository.findByStatus(TripStatus.DRAFT)).thenReturn(Collections.emptyList());
        when(driverRepository.findByStatus(any())).thenReturn(Collections.emptyList());
        when(vehicleRepository.findAll()).thenReturn(Collections.singletonList(testVehicle));

        DashboardKpiResponse kpis = reportService.getDashboardKpis();

        assertNotNull(kpis);
        assertEquals(1, kpis.getAvailableVehicles());
        assertEquals(0, kpis.getActiveVehicles());
        assertEquals(BigDecimal.ZERO.setScale(2), kpis.getFleetUtilization());
    }

    @Test
    void getFuelEfficiencyReport_Success() {
        when(vehicleRepository.findAll()).thenReturn(Collections.singletonList(testVehicle));
        when(tripRepository.findByVehicleId(1L)).thenReturn(Collections.singletonList(testTrip));
        when(fuelLogRepository.findByVehicleId(1L)).thenReturn(Collections.singletonList(testFuelLog));

        List<FuelEfficiencyReport> list = reportService.getFuelEfficiencyReport();

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals(BigDecimal.valueOf(10.00).setScale(2), list.get(0).getFuelEfficiency()); // 100 / 10 = 10
    }

    @Test
    void getOperationalCostReport_Success() {
        when(vehicleRepository.findAll()).thenReturn(Collections.singletonList(testVehicle));
        when(fuelLogRepository.findByVehicleId(1L)).thenReturn(Collections.singletonList(testFuelLog));
        when(maintenanceLogRepository.findByVehicleId(1L)).thenReturn(Collections.emptyList());
        when(expenseRepository.findByVehicleId(1L)).thenReturn(Collections.emptyList());

        List<OperationalCostReport> list = reportService.getOperationalCostReport();

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals(BigDecimal.valueOf(15), list.get(0).getTotalOperationalCost());
    }

    @Test
    void getRoiReport_Success() {
        when(vehicleRepository.findAll()).thenReturn(Collections.singletonList(testVehicle));
        when(tripRepository.findByVehicleId(1L)).thenReturn(Collections.singletonList(testTrip));
        when(fuelLogRepository.findByVehicleId(1L)).thenReturn(Collections.singletonList(testFuelLog));
        when(maintenanceLogRepository.findByVehicleId(1L)).thenReturn(Collections.emptyList());
        when(expenseRepository.findByVehicleId(1L)).thenReturn(Collections.emptyList());

        List<RoiReport> list = reportService.getRoiReport();

        assertNotNull(list);
        assertEquals(1, list.size());
        // Revenue = 100 * 2.50 = 250
        // Expenses = 15
        // AcquisitionCost = 40000
        // ROI = (250 - 15) / 40000 = 235 / 40000 = 0.0059
        assertEquals(BigDecimal.valueOf(0.0059), list.get(0).getRoi());
    }
}

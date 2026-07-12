package com.transitops_backend.service;

import com.transitops_backend.dto.DashboardKpiResponse;
import com.transitops_backend.dto.FuelEfficiencyReport;
import com.transitops_backend.dto.OperationalCostReport;
import com.transitops_backend.dto.RoiReport;
import com.transitops_backend.entity.*;
import com.transitops_backend.enums.DriverStatus;
import com.transitops_backend.enums.TripStatus;
import com.transitops_backend.enums.VehicleStatus;
import com.transitops_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final TripRepository tripRepository;
    private final MaintenanceLogRepository maintenanceLogRepository;
    private final FuelLogRepository fuelLogRepository;
    private final ExpenseRepository expenseRepository;

    private static final BigDecimal REVENUE_RATE_PER_DISTANCE = BigDecimal.valueOf(2.50); // $2.50 per unit distance

    public DashboardKpiResponse getDashboardKpis() {
        long activeVehicles = vehicleRepository.findByStatus(VehicleStatus.ON_TRIP).size();
        long availableVehicles = vehicleRepository.findByStatus(VehicleStatus.AVAILABLE).size();
        long vehiclesInMaintenance = vehicleRepository.findByStatus(VehicleStatus.IN_SHOP).size();

        long activeTrips = tripRepository.findByStatus(TripStatus.DISPATCHED).size();
        long pendingTrips = tripRepository.findByStatus(TripStatus.DRAFT).size();

        long driversOnDuty = driverRepository.findByStatus(DriverStatus.AVAILABLE).size()
                + driverRepository.findByStatus(DriverStatus.ON_TRIP).size();

        // Utilization Calculation: (Active Vehicles / Total Non-Retired Vehicles) * 100
        List<Vehicle> allVehicles = vehicleRepository.findAll();
        long totalNonRetired = allVehicles.stream()
                .filter(v -> v.getStatus() != VehicleStatus.RETIRED)
                .count();

        BigDecimal utilization = BigDecimal.ZERO;
        if (totalNonRetired > 0) {
            utilization = BigDecimal.valueOf(activeVehicles)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalNonRetired), 2, RoundingMode.HALF_UP);
        }

        return DashboardKpiResponse.builder()
                .activeVehicles(activeVehicles)
                .availableVehicles(availableVehicles)
                .vehiclesInMaintenance(vehiclesInMaintenance)
                .activeTrips(activeTrips)
                .pendingTrips(pendingTrips)
                .driversOnDuty(driversOnDuty)
                .fleetUtilization(utilization)
                .build();
    }

    public List<FuelEfficiencyReport> getFuelEfficiencyReport() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<FuelEfficiencyReport> reportList = new ArrayList<>();

        for (Vehicle v : vehicles) {
            List<Trip> trips = tripRepository.findByVehicleId(v.getId());
            BigDecimal totalDistance = trips.stream()
                    .filter(t -> t.getStatus() == TripStatus.COMPLETED && t.getActualDistance() != null)
                    .map(Trip::getActualDistance)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            List<FuelLog> fuelLogs = fuelLogRepository.findByVehicleId(v.getId());
            BigDecimal totalFuel = fuelLogs.stream()
                    .map(FuelLog::getLiters)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal efficiency = BigDecimal.ZERO;
            if (totalFuel.compareTo(BigDecimal.ZERO) > 0) {
                efficiency = totalDistance.divide(totalFuel, 2, RoundingMode.HALF_UP);
            }

            reportList.add(FuelEfficiencyReport.builder()
                    .vehicleId(v.getId())
                    .registrationNumber(v.getRegistrationNumber())
                    .modelName(v.getModelName())
                    .totalDistance(totalDistance)
                    .totalFuelLiters(totalFuel)
                    .fuelEfficiency(efficiency)
                    .build());
        }

        return reportList;
    }

    public List<OperationalCostReport> getOperationalCostReport() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<OperationalCostReport> reportList = new ArrayList<>();

        for (Vehicle v : vehicles) {
            BigDecimal fuelCost = fuelLogRepository.findByVehicleId(v.getId()).stream()
                    .map(fl -> fl.getCost() != null ? fl.getCost() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal maintenanceCost = maintenanceLogRepository.findByVehicleId(v.getId()).stream()
                    .map(ml -> ml.getCost() != null ? ml.getCost() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal otherExpenses = expenseRepository.findByVehicleId(v.getId()).stream()
                    .map(ex -> ex.getAmount() != null ? ex.getAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalCost = fuelCost.add(maintenanceCost).add(otherExpenses);

            reportList.add(OperationalCostReport.builder()
                    .vehicleId(v.getId())
                    .registrationNumber(v.getRegistrationNumber())
                    .modelName(v.getModelName())
                    .fuelCost(fuelCost)
                    .maintenanceCost(maintenanceCost)
                    .otherExpenses(otherExpenses)
                    .totalOperationalCost(totalCost)
                    .build());
        }

        return reportList;
    }

    public List<RoiReport> getRoiReport() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<RoiReport> reportList = new ArrayList<>();

        for (Vehicle v : vehicles) {
            // Revenue: total actual distance * rate for completed trips
            List<Trip> trips = tripRepository.findByVehicleId(v.getId());
            BigDecimal totalDistance = trips.stream()
                    .filter(t -> t.getStatus() == TripStatus.COMPLETED && t.getActualDistance() != null)
                    .map(Trip::getActualDistance)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal revenue = totalDistance.multiply(REVENUE_RATE_PER_DISTANCE);

            // Expenses: fuel + maintenance + other
            BigDecimal fuelCost = fuelLogRepository.findByVehicleId(v.getId()).stream()
                    .map(fl -> fl.getCost() != null ? fl.getCost() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal maintenanceCost = maintenanceLogRepository.findByVehicleId(v.getId()).stream()
                    .map(ml -> ml.getCost() != null ? ml.getCost() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal otherExpenses = expenseRepository.findByVehicleId(v.getId()).stream()
                    .map(ex -> ex.getAmount() != null ? ex.getAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalExpenses = fuelCost.add(maintenanceCost).add(otherExpenses);

            // ROI: (revenue - totalExpenses) / acquisitionCost
            BigDecimal acquisitionCost = v.getAcquisitionCost() != null ? v.getAcquisitionCost() : BigDecimal.ZERO;
            BigDecimal roi = BigDecimal.ZERO;

            if (acquisitionCost.compareTo(BigDecimal.ZERO) > 0) {
                roi = revenue.subtract(totalExpenses)
                        .divide(acquisitionCost, 4, RoundingMode.HALF_UP);
            }

            reportList.add(RoiReport.builder()
                    .vehicleId(v.getId())
                    .registrationNumber(v.getRegistrationNumber())
                    .modelName(v.getModelName())
                    .revenue(revenue)
                    .totalExpenses(totalExpenses)
                    .acquisitionCost(acquisitionCost)
                    .roi(roi)
                    .build());
        }

        return reportList;
    }

    public String generateReportsCsv() {
        StringBuilder csv = new StringBuilder();
        csv.append("Vehicle ID,Registration Number,Model Name,Fuel Cost,Maintenance Cost,Other Expenses,Total Operational Cost,Total Distance,Fuel Consumed (L),Fuel Efficiency,Revenue,ROI\n");

        List<Vehicle> vehicles = vehicleRepository.findAll();
        for (Vehicle v : vehicles) {
            // Distance
            List<Trip> trips = tripRepository.findByVehicleId(v.getId());
            BigDecimal totalDistance = trips.stream()
                    .filter(t -> t.getStatus() == TripStatus.COMPLETED && t.getActualDistance() != null)
                    .map(Trip::getActualDistance)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Fuel metrics
            List<FuelLog> fuelLogs = fuelLogRepository.findByVehicleId(v.getId());
            BigDecimal totalFuel = fuelLogs.stream()
                    .map(FuelLog::getLiters)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal fuelCost = fuelLogs.stream()
                    .map(fl -> fl.getCost() != null ? fl.getCost() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal efficiency = BigDecimal.ZERO;
            if (totalFuel.compareTo(BigDecimal.ZERO) > 0) {
                efficiency = totalDistance.divide(totalFuel, 2, RoundingMode.HALF_UP);
            }

            // Other costs
            BigDecimal maintenanceCost = maintenanceLogRepository.findByVehicleId(v.getId()).stream()
                    .map(ml -> ml.getCost() != null ? ml.getCost() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal otherExpenses = expenseRepository.findByVehicleId(v.getId()).stream()
                    .map(ex -> ex.getAmount() != null ? ex.getAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalCost = fuelCost.add(maintenanceCost).add(otherExpenses);
            BigDecimal revenue = totalDistance.multiply(REVENUE_RATE_PER_DISTANCE);

            BigDecimal acquisitionCost = v.getAcquisitionCost() != null ? v.getAcquisitionCost() : BigDecimal.ZERO;
            BigDecimal roi = BigDecimal.ZERO;
            if (acquisitionCost.compareTo(BigDecimal.ZERO) > 0) {
                roi = revenue.subtract(totalCost).divide(acquisitionCost, 4, RoundingMode.HALF_UP);
            }

            csv.append(v.getId()).append(",")
                    .append(v.getRegistrationNumber()).append(",")
                    .append(v.getModelName()).append(",")
                    .append(fuelCost).append(",")
                    .append(maintenanceCost).append(",")
                    .append(otherExpenses).append(",")
                    .append(totalCost).append(",")
                    .append(totalDistance).append(",")
                    .append(totalFuel).append(",")
                    .append(efficiency).append(",")
                    .append(revenue).append(",")
                    .append(roi).append("\n");
        }

        return csv.toString();
    }
}

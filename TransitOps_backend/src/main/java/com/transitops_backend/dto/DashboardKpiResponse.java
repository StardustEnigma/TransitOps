package com.transitops_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardKpiResponse {

    private long activeVehicles;          // status = ON_TRIP
    private long availableVehicles;       // status = AVAILABLE
    private long vehiclesInMaintenance;   // status = IN_SHOP
    private long activeTrips;             // status = DISPATCHED
    private long pendingTrips;            // status = DRAFT
    private long driversOnDuty;           // status = AVAILABLE or ON_TRIP
    private BigDecimal fleetUtilization;  // (activeVehicles / total non-retired vehicles) * 100
}

package com.transitops_backend.repository;

import com.transitops_backend.entity.MaintenanceLog;
import com.transitops_backend.enums.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceLogRepository extends JpaRepository<MaintenanceLog, Long> {

    List<MaintenanceLog> findByVehicleId(Long vehicleId);

    List<MaintenanceLog> findByStatus(MaintenanceStatus status);
}

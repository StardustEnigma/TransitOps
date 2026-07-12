package com.transitops_backend.service;

import com.transitops_backend.dto.DriverRequest;
import com.transitops_backend.dto.DriverResponse;
import com.transitops_backend.entity.Driver;
import com.transitops_backend.enums.DriverStatus;
import com.transitops_backend.exception.BusinessRuleException;
import com.transitops_backend.exception.ResourceNotFoundException;
import com.transitops_backend.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;

    public List<DriverResponse> getAllDrivers() {
        return driverRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<DriverResponse> getDriversByStatus(DriverStatus status) {
        return driverRepository.findByStatus(status).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public DriverResponse getDriverById(Long id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", id));
        return toResponse(driver);
    }

    @Transactional
    public DriverResponse createDriver(DriverRequest request) {
        if (driverRepository.existsByLicenseNumber(request.getLicenseNumber())) {
            throw new BusinessRuleException("Driver with license number already exists: " + request.getLicenseNumber());
        }

        Driver driver = Driver.builder()
                .name(request.getName())
                .licenseNumber(request.getLicenseNumber())
                .licenseCategory(request.getLicenseCategory())
                .licenseExpiry(request.getLicenseExpiry())
                .contactNumber(request.getContactNumber())
                .safetyScore(request.getSafetyScore() != null ? request.getSafetyScore() : 100)
                .status(DriverStatus.AVAILABLE)
                .build();

        driver = driverRepository.save(driver);
        return toResponse(driver);
    }

    @Transactional
    public DriverResponse updateDriver(Long id, DriverRequest request) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", id));

        if (!driver.getLicenseNumber().equals(request.getLicenseNumber())
                && driverRepository.existsByLicenseNumber(request.getLicenseNumber())) {
            throw new BusinessRuleException("Driver with license number already exists: " + request.getLicenseNumber());
        }

        driver.setName(request.getName());
        driver.setLicenseNumber(request.getLicenseNumber());
        if (request.getLicenseCategory() != null) {
            driver.setLicenseCategory(request.getLicenseCategory());
        }
        if (request.getLicenseExpiry() != null) {
            driver.setLicenseExpiry(request.getLicenseExpiry());
        }
        if (request.getContactNumber() != null) {
            driver.setContactNumber(request.getContactNumber());
        }
        if (request.getSafetyScore() != null) {
            driver.setSafetyScore(request.getSafetyScore());
        }

        driver = driverRepository.save(driver);
        return toResponse(driver);
    }

    @Transactional
    public void deleteDriver(Long id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", id));

        if (driver.getStatus() == DriverStatus.ON_TRIP) {
            throw new BusinessRuleException("Cannot delete driver that is currently on a trip");
        }

        driverRepository.delete(driver);
    }

    private DriverResponse toResponse(Driver driver) {
        return DriverResponse.builder()
                .id(driver.getId())
                .name(driver.getName())
                .licenseNumber(driver.getLicenseNumber())
                .licenseCategory(driver.getLicenseCategory())
                .licenseExpiry(driver.getLicenseExpiry())
                .contactNumber(driver.getContactNumber())
                .safetyScore(driver.getSafetyScore())
                .status(driver.getStatus())
                .licenseExpired(driver.isLicenseExpired())
                .version(driver.getVersion())
                .createdAt(driver.getCreatedAt())
                .updatedAt(driver.getUpdatedAt())
                .build();
    }
}

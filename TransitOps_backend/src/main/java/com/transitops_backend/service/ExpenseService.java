package com.transitops_backend.service;

import com.transitops_backend.dto.ExpenseRequest;
import com.transitops_backend.dto.ExpenseResponse;
import com.transitops_backend.entity.Expense;
import com.transitops_backend.entity.Trip;
import com.transitops_backend.entity.Vehicle;
import com.transitops_backend.enums.ExpenseType;
import com.transitops_backend.exception.ResourceNotFoundException;
import com.transitops_backend.repository.ExpenseRepository;
import com.transitops_backend.repository.TripRepository;
import com.transitops_backend.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import com.transitops_backend.exception.BusinessRuleException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;

    private String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }

    private boolean isCurrentUserDriver() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"));
    }

    public List<ExpenseResponse> getAllExpenses() {
        if (isCurrentUserDriver()) {
            String email = getCurrentUserEmail();
            return expenseRepository.findAll().stream()
                    .filter(e -> e.getTrip() != null && e.getTrip().getDriver() != null && email.equals(e.getTrip().getDriver().getEmail()))
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        return expenseRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ExpenseResponse> getByVehicleId(Long vehicleId) {
        if (isCurrentUserDriver()) {
            String email = getCurrentUserEmail();
            return expenseRepository.findByVehicleId(vehicleId).stream()
                    .filter(e -> e.getTrip() != null && e.getTrip().getDriver() != null && email.equals(e.getTrip().getDriver().getEmail()))
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        return expenseRepository.findByVehicleId(vehicleId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ExpenseResponse> getByType(ExpenseType type) {
        if (isCurrentUserDriver()) {
            String email = getCurrentUserEmail();
            return expenseRepository.findByExpenseType(type).stream()
                    .filter(e -> e.getTrip() != null && e.getTrip().getDriver() != null && email.equals(e.getTrip().getDriver().getEmail()))
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        return expenseRepository.findByExpenseType(type).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ExpenseResponse getById(Long id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", id));
        if (isCurrentUserDriver()) {
            String email = getCurrentUserEmail();
            if (expense.getTrip() == null || expense.getTrip().getDriver() == null || !email.equals(expense.getTrip().getDriver().getEmail())) {
                throw new BusinessRuleException("Access denied: This expense does not belong to your trips.");
            }
        }
        return toResponse(expense);
    }

    @Transactional
    public ExpenseResponse createExpense(ExpenseRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", request.getVehicleId()));

        Trip trip = null;
        if (request.getTripId() != null) {
            trip = tripRepository.findById(request.getTripId())
                    .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", request.getTripId()));
        }

        if (isCurrentUserDriver()) {
            String email = getCurrentUserEmail();
            if (trip == null || trip.getDriver() == null || !email.equals(trip.getDriver().getEmail())) {
                throw new BusinessRuleException("Access denied: You can only log expenses for your own assigned trips.");
            }
        }

        ExpenseType expenseType = ExpenseType.valueOf(request.getExpenseType().toUpperCase());

        Expense expense = Expense.builder()
                .vehicle(vehicle)
                .trip(trip)
                .expenseType(expenseType)
                .amount(request.getAmount())
                .description(request.getDescription())
                .expenseDate(request.getExpenseDate())
                .build();

        expense = expenseRepository.save(expense);
        return toResponse(expense);
    }

    private ExpenseResponse toResponse(Expense expense) {
        return ExpenseResponse.builder()
                .id(expense.getId())
                .vehicleId(expense.getVehicle().getId())
                .vehicleRegistration(expense.getVehicle().getRegistrationNumber())
                .tripId(expense.getTrip() != null ? expense.getTrip().getId() : null)
                .expenseType(expense.getExpenseType())
                .amount(expense.getAmount())
                .description(expense.getDescription())
                .expenseDate(expense.getExpenseDate())
                .createdAt(expense.getCreatedAt())
                .updatedAt(expense.getUpdatedAt())
                .build();
    }
}

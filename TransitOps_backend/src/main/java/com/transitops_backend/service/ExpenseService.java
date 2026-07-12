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

    public List<ExpenseResponse> getAllExpenses() {
        return expenseRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ExpenseResponse> getByVehicleId(Long vehicleId) {
        return expenseRepository.findByVehicleId(vehicleId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ExpenseResponse> getByType(ExpenseType type) {
        return expenseRepository.findByExpenseType(type).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ExpenseResponse getById(Long id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", id));
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

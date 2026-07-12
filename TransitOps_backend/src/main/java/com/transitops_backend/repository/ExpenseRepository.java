package com.transitops_backend.repository;

import com.transitops_backend.entity.Expense;
import com.transitops_backend.enums.ExpenseType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByVehicleId(Long vehicleId);

    List<Expense> findByExpenseType(ExpenseType expenseType);

    List<Expense> findByTripId(Long tripId);
}

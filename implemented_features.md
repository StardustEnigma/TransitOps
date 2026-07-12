# Smart Transport Operations Platform (TransitOps) — Implemented Features

This document outlines the features and infrastructure implemented for the **TransitOps** backend and deployment integration.

---

## 1. Security & Authentication (JWT + RBAC)
*   **Stateless JWT Security Filter:** Added `JwtAuthenticationFilter` which intercepts incoming HTTP requests, extracts the Bearer token, validates it, and securely establishes the authentication context.
*   **Safe Filter Execution:** Configured try-catch blocks inside the filter to gracefully bypass authentication rather than throwing unhandled exceptions (e.g. `UsernameNotFoundException`) on public endpoints when invalid/old tokens are passed.
*   **Spring Security 7.0 & Spring Boot 4.1.0 Compatibility:** Updated the authentication configuration to comply with the latest Spring Security standards (removed obsolete no-arg constructors in `DaoAuthenticationProvider` and explicitly exposed the `UserDetailsService` bean to prevent default password generation).
*   **CORS Configuration:** Configured CORS rules to permit incoming requests from local dev servers (such as React running on port 5173 or 3000) and API testing suites (such as Postman).

---

## 2. Complete Layered Architecture (Controller → Service → Repository → DTOs)
Implemented the complete REST API request flow with strict validation rules and transactional constraints for all entities:

### A. Auth & Users
*   Registration with unique email verification, role assignment, and automatic JWT issuance.
*   BCrypt password hashing for secure authentication.
*   Startup seeder (`DataSeeder`) prepopulating the 4 core system roles:
    1.  `FLEET_MANAGER`
    2.  `DRIVER`
    3.  `SAFETY_OFFICER`
    4.  `FINANCIAL_ANALYST`

### B. Vehicles
*   CRUD operations restricted to `FLEET_MANAGER`.
*   Uniqueness checks for vehicle registration numbers.
*   Business validation: Prevents deletion of vehicles currently marked as `ON_TRIP`.

### C. Drivers
*   CRUD operations restricted to `FLEET_MANAGER` and `SAFETY_OFFICER`.
*   License number uniqueness checks.
*   Helper logic determining whether a driver's license has expired (`isLicenseExpired()`).
*   Business validation: Prevents deletion of active drivers.

### D. Trips & Lifecycle Dispatch
*   **State Machine:** Implemented progression flow: `DRAFT` → `DISPATCHED` → `COMPLETED` / `CANCELLED`.
*   **Atomicity:** All status updates are mapped under Spring `@Transactional` blocks to ensure a failure during dispatch/cancel does not leave a vehicle or driver stuck in an inconsistent status.
*   **Dispatch Validation Rules:**
    *   Vehicle must be `AVAILABLE` (not `IN_SHOP` or `ON_TRIP`).
    *   Driver must be `AVAILABLE` (not `ON_TRIP` or `SUSPENDED`).
    *   Driver license expiry date must be valid (checked at dispatch time).
    *   Cargo weight must not exceed the maximum load capacity of the selected vehicle.

### E. Maintenance Logs
*   Logging vehicle tune-ups and repairs.
*   **Side-Effects:** Creating a log flips the vehicle's status to `IN_SHOP`. Closing it restores it to `AVAILABLE` (unless the vehicle has been marked as `RETIRED`).

### F. Fuel & Operating Expenses
*   Operating logs for fuel consumption (liters and cost) and odometer metrics.
*   Logging general expenses (tolls, parking, repairs) associated with vehicles and specific trips.

### G. Dashboard KPIs
*   Real-time aggregation endpoint (`GET /api/dashboard/kpis`) calculating counts for:
    *   Active Vehicles, Available Vehicles, and Vehicles in Maintenance.
    *   Active Trips, Pending Trips, and Drivers On Duty.
    *   Fleet Utilization percentage: `(activeVehicles / total non-retired vehicles) * 100`.

### H. Reports & Analytics (Finance & Fleet Efficiency)
*   **Fuel Efficiency:** (`GET /api/reports/fuel-efficiency`) computing total actual distance divided by total liters consumed per vehicle.
*   **Operational Cost:** (`GET /api/reports/operational-cost`) summing fuel, maintenance, and other expenses per vehicle.
*   **Vehicle ROI:** (`GET /api/reports/roi`) computing `(revenue - total expenses) / acquisition cost` per vehicle (assuming a standard $2.50 per unit distance tariff tariff as the cargo revenue base).
*   **CSV Exports:** (`GET /api/reports/export/csv`) returning a downloadable CSV spreadsheet containing all computed fleet performance statistics.

---

## 3. API Integration & Documentation
*   **Postman Collection:** Created a complete JSON collection [transitops_postman_collection.json](file:///d:/Projects/TransitOps/transitops_postman_collection.json) containing pre-filled request templates and a script to automatically capture and bind the JWT token dynamically for subsequent requests, including the new Dashboard and Reports folders.
*   **REST API Documentation:** Created a detailed API manual [api_documentation.md](file:///d:/Projects/TransitOps/api_documentation.md) illustrating the request/response payloads, validation rules, HTTP status codes, and endpoint schemas.
*   **Global Exception Handling:** Configured `GlobalExceptionHandler` to translate method validation errors (400 Bad Request) and business rule exceptions (422 Unprocessable Entity) into clean, user-friendly JSON messages.

---

## 4. All-in-One Docker Deployment
*   **SPA Assets Integration:** A multi-stage Docker build that compiles the React SPA via Node.js, compiles the Java application via Maven, copies the static React assets into the Spring Boot public directory, and mounts a container-based PostgreSQL DB.
*   **Single Port Binding:** Configured port mapping to serve both the frontend UI and backend REST API under a single port (`8080`), eliminating complex host database port conflicts.

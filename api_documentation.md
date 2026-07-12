# TransitOps API Documentation
### Smart Transport Operations Platform | Backend REST Endpoints

All backend endpoints are hosted on `http://localhost:8080`. Except for the authentication endpoints, all requests require a JSON Web Token (JWT) in the HTTP `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

---

## Table of Contents
1. [Authentication & RBAC Roles](#1-authentication--rbac-roles)
2. [Vehicles API](#2-vehicles-api)
3. [Drivers API](#3-drivers-api)
4. [Trips API & Lifecycle](#4-trips-api--lifecycle)
5. [Maintenance API](#5-maintenance-api)
6. [Fuel & Expense API](#6-fuel--expense-api)
7. [Error Handling](#7-error-handling)

---

## 1. Authentication & RBAC Roles

### Roles
The system auto-seeds 4 roles:
- `FLEET_MANAGER`: Full CRUD access over fleet assets, maintenance logs, and expenses.
- `DRIVER`: Can create, dispatch, complete, and cancel trips.
- `SAFETY_OFFICER`: Full CRUD access over driver profiles, compliance, and scores.
- `FINANCIAL_ANALYST`: Read-only access to expenses, fuel logs, and financial metrics.

### Endpoints

#### Register a User
*   **URL:** `/api/auth/register`
*   **Method:** `POST`
*   **Auth Required:** None
*   **Request Body:**
    ```json
    {
        "name": "Alice Manager",
        "email": "manager@transitops.com",
        "password": "password123",
        "roleName": "FLEET_MANAGER"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
        "token": "eyJhbGciOiJIUzI1NiJ9...",
        "email": "manager@transitops.com",
        "role": "FLEET_MANAGER",
        "name": "Alice Manager"
    }
    ```

#### Login User
*   **URL:** `/api/auth/login`
*   **Method:** `POST`
*   **Auth Required:** None
*   **Request Body:**
    ```json
    {
        "email": "manager@transitops.com",
        "password": "password123"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
        "token": "eyJhbGciOiJIUzI1NiJ9...",
        "email": "manager@transitops.com",
        "role": "FLEET_MANAGER",
        "name": "Alice Manager"
    }
    ```

---

## 2. Vehicles API

#### Get All Vehicles
*   **URL:** `/api/vehicles`
*   **Method:** `GET`
*   **Query Params:** `status` (optional - `AVAILABLE`, `ON_TRIP`, `IN_SHOP`, `RETIRED`)
*   **Response (200 OK):**
    ```json
    [
        {
            "id": 1,
            "registrationNumber": "VAN-005",
            "modelName": "Ford Transit 2024",
            "type": "Cargo Van",
            "maxLoadCapacity": 1500.00,
            "odometer": 12000.50,
            "acquisitionCost": 45000.00,
            "status": "AVAILABLE",
            "version": 0,
            "createdAt": "2026-07-12T10:20:00",
            "updatedAt": "2026-07-12T10:20:00"
        }
    ]
    ```

#### Create Vehicle
*   **URL:** `/api/vehicles`
*   **Method:** `POST`
*   **Roles Allowed:** `FLEET_MANAGER`
*   **Request Body:**
    ```json
    {
        "registrationNumber": "VAN-005",
        "modelName": "Ford Transit 2024",
        "type": "Cargo Van",
        "maxLoadCapacity": 1500.00,
        "odometer": 12000.50,
        "acquisitionCost": 45000.00
    }
    ```
*   **Response (201 Created):** Same schema as GET vehicle.

#### Get Vehicle by ID
*   **URL:** `/api/vehicles/{id}`
*   **Method:** `GET`

#### Update Vehicle
*   **URL:** `/api/vehicles/{id}`
*   **Method:** `PUT`
*   **Roles Allowed:** `FLEET_MANAGER`

#### Delete Vehicle
*   **URL:** `/api/vehicles/{id}`
*   **Method:** `DELETE`
*   **Roles Allowed:** `FLEET_MANAGER`
*   **Rule:** Cannot delete a vehicle currently `ON_TRIP`.

---

## 3. Drivers API

#### Get All Drivers
*   **URL:** `/api/drivers`
*   **Method:** `GET`
*   **Query Params:** `status` (optional - `AVAILABLE`, `ON_TRIP`, `OFF_DUTY`, `SUSPENDED`)

#### Create Driver
*   **URL:** `/api/drivers`
*   **Method:** `POST`
*   **Roles Allowed:** `FLEET_MANAGER`, `SAFETY_OFFICER`
*   **Request Body:**
    ```json
    {
        "name": "John Doe",
        "licenseNumber": "DL-99887766",
        "licenseCategory": "Class A",
        "licenseExpiry": "2028-12-31",
        "contactNumber": "+15550199",
        "safetyScore": 95
    }
    ```
*   **Response (201 Created):**
    ```json
    {
        "id": 1,
        "name": "John Doe",
        "licenseNumber": "DL-99887766",
        "licenseCategory": "Class A",
        "licenseExpiry": "2028-12-31",
        "contactNumber": "+15550199",
        "safetyScore": 95,
        "status": "AVAILABLE",
        "licenseExpired": false,
        "version": 0,
        "createdAt": "2026-07-12T10:20:00"
    }
    ```

#### Update/Delete Driver
*   **URL:** `/api/drivers/{id}`
*   **Method:** `PUT` / `DELETE`
*   **Roles Allowed:** `FLEET_MANAGER`, `SAFETY_OFFICER`
*   **Rule:** Cannot delete a driver currently `ON_TRIP`.

---

## 4. Trips API & Lifecycle

Trips progress through a strict lifecycle state machine:
`DRAFT` → `DISPATCHED` → `COMPLETED` / `CANCELLED`.

#### Create Trip (Draft)
*   **URL:** `/api/trips`
*   **Method:** `POST`
*   **Roles Allowed:** `DRIVER`, `FLEET_MANAGER`
*   **Request Body:**
    ```json
    {
        "vehicleId": 1,
        "driverId": 1,
        "source": "Warehouse Alpha",
        "destination": "Retail Hub Beta",
        "cargoWeight": 850.00,
        "plannedDistance": 120.50
    }
    ```

#### Dispatch Trip
*   **URL:** `/api/trips/{id}/dispatch`
*   **Method:** `POST`
*   **Roles Allowed:** `DRIVER`, `FLEET_MANAGER`
*   **Validations Enforced:**
    1. Vehicle status must be `AVAILABLE`.
    2. Driver status must be `AVAILABLE` (not `ON_TRIP`, `SUSPENDED` etc).
    3. Driver license must not be expired.
    4. Cargo weight must not exceed the vehicle's `maxLoadCapacity`.
*   **Side Effects:** Vehicle & Driver status atomically flip to `ON_TRIP`.

#### Complete Trip
*   **URL:** `/api/trips/{id}/complete`
*   **Method:** `POST`
*   **Roles Allowed:** `DRIVER`, `FLEET_MANAGER`
*   **Request Body:**
    ```json
    {
        "actualDistance": 122.10
    }
    ```
*   **Side Effects:** Vehicle & Driver status restore to `AVAILABLE`.

#### Cancel Trip
*   **URL:** `/api/trips/{id}/cancel`
*   **Method:** `POST`
*   **Roles Allowed:** `DRIVER`, `FLEET_MANAGER`
*   **Side Effects:** Restores vehicle/driver to `AVAILABLE` if the trip was already dispatched.

---

## 5. Maintenance API

#### Log Maintenance (Start)
*   **URL:** `/api/maintenance`
*   **Method:** `POST`
*   **Roles Allowed:** `FLEET_MANAGER`
*   **Request Body:**
    ```json
    {
        "vehicleId": 1,
        "title": "Engine Tune-up",
        "description": "Routine checkup and oil change",
        "maintenanceDate": "2026-07-12",
        "cost": 250.00
    }
    ```
*   **Side Effects:** Sets the vehicle status to `IN_SHOP`.

#### Close Maintenance Log
*   **URL:** `/api/maintenance/{id}/close`
*   **Method:** `POST`
*   **Roles Allowed:** `FLEET_MANAGER`
*   **Side Effects:** Restores the vehicle status to `AVAILABLE` (unless it is `RETIRED`).

---

## 6. Fuel & Expense API

#### Log Fuel Consumption
*   **URL:** `/api/fuel-logs`
*   **Method:** `POST`
*   **Roles Allowed:** `FLEET_MANAGER`
*   **Request Body:**
    ```json
    {
        "vehicleId": 1,
        "tripId": 1,
        "liters": 45.50,
        "cost": 68.25,
        "odometer": 12095.50,
        "fuelDate": "2026-07-12"
    }
    ```

#### Log Operating Expense
*   **URL:** `/api/expenses`
*   **Method:** `POST`
*   **Roles Allowed:** `FLEET_MANAGER`
*   **Request Body:**
    ```json
    {
        "vehicleId": 1,
        "expenseType": "TOLL", // TOLL, FUEL, MAINTENANCE, PARKING, REPAIR, OTHER
        "amount": 15.00,
        "description": "Highway toll charge",
        "expenseDate": "2026-07-12"
    }
    ```

#### Read Fuel Logs & Expenses
*   **URL:** `/api/fuel-logs` or `/api/expenses`
*   **Method:** `GET`
*   **Query Params:** `vehicleId`, `type` (for expenses)
*   **Roles Allowed:** `FLEET_MANAGER`, `FINANCIAL_ANALYST`

---

## 7. Error Handling

All constraint validation errors and business rule violations return a standardized payload layout:

#### Example Validation Error (400 Bad Request):
```json
{
    "timestamp": "2026-07-12T10:20:05.123",
    "status": 400,
    "error": "Validation Failed",
    "fieldErrors": {
        "email": "Email must be valid",
        "password": "Password must be at least 6 characters"
    }
}
```

#### Example Business Rule Violation (422 Unprocessable Entity):
```json
{
    "timestamp": "2026-07-12T10:20:10.456",
    "status": 422,
    "error": "Unprocessable Entity",
    "message": "Cargo weight (1800.00) exceeds vehicle max capacity (1500.00)"
}
```

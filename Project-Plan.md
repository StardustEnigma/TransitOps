# TransitOps — Full Project Plan
### Smart Transport Operations Platform | 8-Hour Hackathon

---

## 1. Problem Statement Summary

Logistics companies run transport ops on spreadsheets/logbooks, causing scheduling
conflicts, underused vehicles, missed maintenance, expired licenses, bad expense
tracking, and no operational visibility.

**TransitOps** centralizes: vehicle registry → driver management → trip
dispatch → maintenance → fuel/expense logging → analytics, with business rules
enforced at every step (not just UI hints).

### Target Users (RBAC roles)
| Role | Responsibility |
|---|---|
| Fleet Manager | Oversees fleet assets, maintenance, vehicle lifecycle |
| Driver | Creates trips, assigns vehicle/driver, monitors deliveries |
| Safety Officer | Driver compliance, license validity, safety scores |
| Financial Analyst | Expenses, fuel cost, maintenance cost, profitability |

---

## 2. Tech Stack (Locked In)

- **Backend:** Spring Boot 4.1.0, Spring Security (JWT), Spring Data JPA, Bean Validation
- **Database:** PostgreSQL — **installed locally on each teammate's laptop** (no Docker, no cloud/BaaS/DBaaS — organizers explicitly reward local DB setup and prohibit third-party services)
- **Frontend:** React + Vite, Recharts (charts), shadcn/ui or MUI (components), Axios
- **Auth:** JWT (jjwt library, pulled in via GitHub reference + Maven deps)
- **Schema strategy:** `spring.jpa.hibernate.ddl-auto=create-drop` — Hibernate builds tables from JPA entities on every start, so every teammate's local Postgres ends up with an identical schema without hand-written SQL or a shared live DB.

### Why judges should care about this DB setup specifically
- Fully self-hosted, no external dependency — matches org rules exactly
- Real schema design work is visible (constraints, indexes, relationships) — not hidden behind a BaaS auto-generated API
- Each teammate develops independently; only the demo machine needs a live DB at presentation time

---

## 3. Architecture (Clean, Layered)

```
Controller  →  Service  →  Repository  →  Entity (JPA) →  PostgreSQL
     ↑              ↑
   DTOs      Business rules / validation
     ↑
@RestControllerAdvice (global error handling)
```

- **DTOs** at the boundary — entities never returned directly from controllers
- **Service layer** owns all business-rule enforcement (status transitions, validation chains) — controllers stay thin
- **Two-layer validation:**
  1. Bean Validation (`@Valid` + annotations) on DTOs — structural correctness (required fields, positive numbers, valid email/phone)
  2. Service-layer checks — business rules that need DB state (license expiry, vehicle/driver availability, cargo weight vs. capacity)
- **Global exception handler** (`@RestControllerAdvice`) — converts validation errors and business-rule violations into consistent JSON error responses, never a raw stack trace
- **JWT stateless auth** — no server-side session state, horizontally scalable
- **Optimistic locking** (`@Version` on Vehicle/Driver/Trip) — protects against two dispatchers grabbing the same vehicle/driver simultaneously

---

## 4. Database Schema (ER Design)

### Entities & Key Fields

**User**
- id, name, email (unique), password (BCrypt hash), role (enum), enabled, createdAt, updatedAt

**Vehicle**
- id, registrationNumber (unique, indexed), nameModel, type, maxLoadCapacityKg, odometer, acquisitionCost, region, status (enum: AVAILABLE/ON_TRIP/IN_SHOP/RETIRED), version (optimistic lock), timestamps

**Driver**
- id, name, licenseNumber (unique), licenseCategory, licenseExpiryDate, contactNumber, safetyScore (0–100), status (enum: AVAILABLE/ON_TRIP/OFF_DUTY/SUSPENDED), version, timestamps
- Computed: `isLicenseExpired()` — checked at dispatch time

**Trip**
- id, source, destination, vehicle (FK → Vehicle, RESTRICT on delete), driver (FK → Driver, RESTRICT on delete), cargoWeightKg, plannedDistanceKm, actualDistanceKm, fuelConsumedLiters, status (enum: DRAFT/DISPATCHED/COMPLETED/CANCELLED), dispatchedAt/completedAt/cancelledAt, version, timestamps

**MaintenanceLog** *(next to build)*
- id, vehicle (FK), description, cost, status (OPEN/CLOSED), openedAt, closedAt

**FuelLog** *(next to build)*
- id, vehicle (FK), liters, cost, date

**Expense** *(next to build)*
- id, vehicle (FK), type (TOLL/MAINTENANCE/OTHER), amount, date, description

### Relationships
- Trip → Vehicle (many-to-one, RESTRICT delete — trip history must survive)
- Trip → Driver (many-to-one, RESTRICT delete)
- MaintenanceLog → Vehicle (many-to-one)
- FuelLog → Vehicle (many-to-one)
- Expense → Vehicle (many-to-one)

### Indexes (for judge-visible DB maturity)
- Vehicle: registrationNumber (unique), status, type, region
- Driver: licenseNumber (unique), status, licenseExpiryDate
- Trip: status
- User: email (unique)

---

## 5. Business Rules → Where They're Enforced

| Rule | Layer | Mechanism |
|---|---|---|
| Registration number unique | DB + Service | `unique = true` constraint + pre-check in service |
| Retired/In Shop vehicles hidden from dispatch | Service/Repository | Query filters `status = AVAILABLE` only |
| Expired license / Suspended driver blocked | Service | Check `isLicenseExpired()` + status before dispatch |
| Vehicle/Driver already On Trip blocked | Service | Status check before dispatch, inside a transaction |
| Cargo weight ≤ max capacity | DTO + Service | `@Positive` + explicit comparison against `Vehicle.maxLoadCapacityKg` |
| Dispatch → both Vehicle & Driver → On Trip | Service | Single `@Transactional` method updates both |
| Complete → both → Available | Service | Same pattern, transactional |
| Cancel dispatched trip → restore Available | Service | Same pattern |
| Maintenance record → Vehicle → In Shop | Service | On MaintenanceLog creation |
| Closing maintenance → Vehicle → Available (unless Retired) | Service | Check current status isn't RETIRED before restoring |

All cascading multi-entity updates use `@Transactional` so a partial failure can't leave a vehicle "stuck" On Trip or In Shop.

---

## 6. Planned REST API Endpoints

```
Auth
  POST   /api/auth/register
  POST   /api/auth/login

Vehicles          (Fleet Manager: full CRUD | others: read)
  GET    /api/vehicles                 ?status=&type=&region=&page=&size=
  GET    /api/vehicles/{id}
  POST   /api/vehicles
  PUT    /api/vehicles/{id}
  DELETE /api/vehicles/{id}

Drivers           (Fleet Manager/Safety Officer: full | others: read)
  GET    /api/drivers                  ?status=
  GET    /api/drivers/{id}
  POST   /api/drivers
  PUT    /api/drivers/{id}
  DELETE /api/drivers/{id}

Trips             (Driver role: create/dispatch)
  GET    /api/trips                    ?status=
  GET    /api/trips/{id}
  POST   /api/trips                    (Draft)
  POST   /api/trips/{id}/dispatch
  POST   /api/trips/{id}/complete
  POST   /api/trips/{id}/cancel

Maintenance       (Fleet Manager)
  GET    /api/maintenance              ?vehicleId=
  POST   /api/maintenance
  POST   /api/maintenance/{id}/close

Fuel & Expenses   (Financial Analyst: read | Fleet Manager: write)
  GET    /api/fuel-logs                ?vehicleId=
  POST   /api/fuel-logs
  GET    /api/expenses                 ?vehicleId=
  POST   /api/expenses

Dashboard & Reports
  GET    /api/dashboard/kpis           (Active/Available Vehicles, In Maintenance, Active/Pending Trips, Drivers On Duty, Fleet Utilization %)
  GET    /api/reports/fuel-efficiency  (distance / fuel, per vehicle)
  GET    /api/reports/operational-cost (fuel + maintenance per vehicle)
  GET    /api/reports/roi              ((revenue - (maintenance + fuel)) / acquisitionCost)
  GET    /api/reports/export/csv
```

All endpoints except `/api/auth/**` require a valid JWT; role checks via `@PreAuthorize`.

---

## 7. Testing Plan

- **Unit tests** (JUnit 5 + Mockito, already in `pom.xml` via `spring-boot-starter-test`):
  - Service layer is the priority — this is where business rules live
  - Key cases to cover: dispatch rejected when cargo > capacity, dispatch rejected when driver license expired, dispatch rejected when vehicle already On Trip, complete/cancel correctly reverts statuses, maintenance creation flips vehicle to In Shop, closing maintenance restores Available unless Retired
- **Repository tests** (optional, `@DataJpaTest`): uniqueness constraints, status filtering queries
- **Controller tests** (optional, `MockMvc`): validation error responses return correct shape/status code

Test-writing will follow each service as it's built, not be bolted on at the end.

---

## 8. Build Order / Hour-by-Hour Plan

| Time | Focus |
|---|---|
| Hr 1 | Project setup, entities (✅ User/Vehicle/Driver/Trip done), remaining entities (MaintenanceLog/FuelLog/Expense) |
| Hr 2 | Security config, JWT filter, auth endpoints, RBAC |
| Hr 3 | Vehicle + Driver modules (repository/service/controller/DTOs) + unit tests |
| Hr 4 | Trip module — dispatch/complete/cancel logic + validation chain + unit tests (highest-value logic) |
| Hr 5 | Maintenance + Fuel/Expense modules |
| Hr 6 | Dashboard KPIs + Reports (fuel efficiency, cost, ROI) + CSV export |
| Hr 7 | React frontend — auth, Vehicle/Driver/Trip pages, dashboard charts |
| Hr 8 | Polish, bug fixes, seed demo data, rehearse the Van-05 example workflow for the demo |

---

## 9. Deliverables Checklist

**Mandatory**
- [x] Local PostgreSQL setup
- [ ] Responsive web interface
- [ ] Auth + RBAC
- [ ] Vehicle & Driver CRUD
- [ ] Trip management with validations
- [ ] Automatic status transitions
- [ ] Maintenance workflow
- [ ] Fuel & Expense tracking
- [ ] Dashboard with KPIs
- [ ] Charts / visual analytics

**Bonus (only after mandatory is 100% done)**
- [ ] PDF export (CSV is mandatory, PDF optional)
- [ ] Email reminders for expiring licenses
- [ ] Vehicle document management
- [ ] Search/filter/sort
- [ ] Dark mode

---

## 10. Progress So Far

Built:
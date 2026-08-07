# Waste Management AI - System Architecture & Client Blueprint

This document defines the **Master Client Architecture Strategy (Option A)**, role mappings, API contracts, and operational workflows for the Waste Management AI ecosystem.

---

## 🏛️ Ecosystem Overview (Option A Strategy)

The ecosystem consists of **2 Specialized Mobile Applications** and **1 Admin Web Portal**, powered by **1 Core Backend API** (connecting to `central_core_db` and `waste_management` DB) and **1 Microservice** (Notifications).

```mermaid
flowchart TD
    subgraph FrontendClients [Ecosystem Clients (Option A)]
        App1[📱 1. Resident Mobile App<br/>Target: Occupants / Householders]
        App2[📱 2. Driver & Collector Mobile App<br/>Target: Field Workers & Drivers]
        WebPortal[💻 3. Admin & Supervisor Web Portal<br/>Target: Managers & Admins]
    end

    subgraph BackendAPI [Core Backend Services]
        MainAPI[🚀 Main Core Backend API<br/>NestJS]
        NotifyService[🔔 Notification Microservice<br/>Dedicated Worker]
    end

    subgraph Databases [MySQL Databases]
        CoreDB[(MySQL: central_core_db)]
        WasteDB[(MySQL: waste_management DB)]
    end

    App1 -->|REST API / JWT| MainAPI
    App2 -->|REST API / JWT| MainAPI
    WebPortal -->|REST API / JWT| MainAPI

    MainAPI --> CoreDB
    MainAPI --> WasteDB
    MainAPI -.->|Events / Webhooks| NotifyService
```

---

## 📱 Client 1: Resident Mobile App

- **Primary Persona**: Flat Owners, Apartment Residents, Commercial Office Occupants (`RESIDENT` role).
- **Core User Journeys**:
  1. **Pickup Schedules**: View recurring pickup days & time windows for their building/unit (`GET /schedules/daily-checklist`).
  2. **File Complaints**: Upload photo proof of missed collection, spilled waste, or driver delay (`POST /complaints`).
  3. **Track Complaints**: View status transitions (`OPEN` ➔ `IN_PROGRESS` ➔ `RESOLVED` ➔ `CLOSED`) and inspect worker resolution photo proof (`GET /complaints/:id`, `PATCH /complaints/:id`).
  4. **Eco-Score & Carbon Offset**: View CO₂ carbon offset savings and green badges for their unit (`GET /reports/waste-summary`).

---

## 📱 Client 2: Driver & Collector Mobile App

- **Primary Persona**: Waste Collection Truck Drivers & Field Workers (`WORKER_COLLECTOR`, `DRIVER` roles).
- **Core User Journeys**:
  1. **Daily Route Checklist**: View today's assigned pickup stops matching today's day of week (`GET /schedules/daily-checklist?assignedEmployeeId=X`).
  2. **Log Waste Collection**: Record waste pickup transactions (weight in kg, category: Organic/Recyclable/E-Waste, and photo proof) (`POST /waste-collections`).
  3. **Resolve Complaints**: View assigned tickets, navigate to site/unit, upload resolution photo proof, and mark ticket `RESOLVED` (`GET /complaints?assignedEmployeeId=X`, `PATCH /complaints/:id`).

---

## 💻 Client 3: Admin & Supervisor Web Portal

- **Primary Persona**: Society Managers, Municipal Supervisors, Organization Admins (`ORGANIZATION_ADMIN`, `SUPERVISOR`, `SUPER_ADMIN` roles).
- **Core User Journeys**:
  1. **Spatial & Tenant Management**: Manage Organizations, Sites, Buildings, Floors, Units, Residents, and Employees.
  2. **Schedule & SLA Configuration**: Create recurring pickup schedules (`POST /schedules`) and set custom Site-wise & Org-wise SLA thresholds (`highPrioritySlaHours`, `lowPrioritySlaHours`).
  3. **Complaint Management & Escalation**: Assign complaints to drivers, review resolution photo proof, and override ticket statuses.
  4. **Analytics & Reports Engine**: Generate CO₂ offset reports, tree equivalent metrics, SLA breach rates, and worker performance leaderboards (`GET /reports/*`).

---

## 🔐 API Permission & Role Matrix

| Endpoint Group                       | Resident App         | Driver App                    | Admin Web Portal               | Required Permission                     |
| ------------------------------------ | -------------------- | ----------------------------- | ------------------------------ | --------------------------------------- |
| `/auth/*`                            | ✅                   | ✅                            | ✅                             | Public / Authenticated                  |
| `/units`, `/residents`, `/employees` | ❌                   | ❌                            | ✅                             | `units:*`, `residents:*`, `employees:*` |
| `/waste-categories`                  | Read-only            | Read-only                     | Full CRUD                      | `waste_categories:*`                    |
| `/waste-collections`                 | ❌                   | Log Pickups                   | View / Audit All               | `waste_collections:*`                   |
| `/complaints`                        | File / Track / Close | View Assigned / Mark Resolved | Assign / Override / Full Audit | `complaints:*`                          |
| `/schedules`                         | Read Checklist       | Read Today's Checklist        | Full CRUD & Config             | `schedules:*`                           |
| `/reports/*`                         | View Eco-Score       | ❌                            | Full Dashboard & Leaderboard   | `reports:view`                          |

---

## 📝 Design Principles for Future API & Service Development

1. **Role-Tailored DTOs**: DTOs must respect the payload boundaries of the target client (e.g. Residents cannot inject privileged fields like `assignedEmployeeId` or `status`).
2. **Repository Layer Isolation**: All new feature modules must follow `Controller ➔ Service ➔ Repository ➔ PrismaService` isolation.
3. **Dual Database Boundaries**: `central_core_db` owns Identity, RBAC, Hierarchy, and People. `waste_management` owns Waste Operations, Collections, Complaints, Schedules, and Reports.

# 📘 Master Frontend Architecture & API Integration Guide

Welcome to the **Frontend Architecture & API Integration Guide** for the Waste Management AI Platform. This document is designed for frontend developers and AI agents building the **Admin Web Portal**, **Driver Mobile App**, and **Resident Self-Service Portal**.

---

## 🏗️ 1. System Overview & Technology Stack

- **Backend Base URL**: `http://localhost:7001`
- **WebSocket Gateway URL**: `ws://localhost:7001`
- **OpenAPI / Swagger Spec**: `http://localhost:7001/api/docs`
- **Protocol**: HTTP/2 + WebSocket (Socket.IO v4)
- **Data Exchange Format**: JSON (`application/json`) & Multipart FormData (for AWS S3 presigned URL uploads)

---

## 🔑 2. Authentication & Security Contract

### 2.1 Authorization Header Format
All protected HTTP endpoints require a JWT Bearer Token passed in the request header:

```http
Authorization: Bearer <YOUR_JWT_ACCESS_TOKEN>
```

### 2.2 Auth Flow & Token Lifecycle
1. **Login (`POST /auth/login`)**: Returns `accessToken` (expires in 15 minutes) and `refreshToken` (expires in 7 days).
2. **Token Auto-Refresh (`POST /auth/refresh`)**: When an HTTP request returns `401 Unauthorized`, the frontend HTTP interceptor must call `POST /auth/refresh` with `{ refreshToken: "..." }` to receive a new `accessToken`.
3. **Role-Based Access Control (RBAC)**: User permissions follow the format `resource:action` (e.g. `reports:view`, `sites:manage`, `billing:create`). The frontend must hide/disable UI buttons based on the user's permission array returned in `GET /auth/me`.

---

## 📱 3. The 3 Client Portals & Architectural Blueprints

```
                                  ┌──────────────────────────────────────────┐
                                  │      1 UNIFIED NESTJS BACKEND ENGINE     │
                                  │          (http://localhost:7001)         │
                                  └────────────────────┬─────────────────────┘
                                                       │
         ┌─────────────────────────────────────────────┼─────────────────────────────────────────────┐
         ▼                                             ▼                                             ▼
┌────────────────────────────────┐            ┌────────────────────────────────┐            ┌────────────────────────────────┐
│  1. Admin Web Portal (React)   │            │ 2. Driver Mobile App (iOS/Android)│         │ 3. Resident Portal (Mobile/Web)│
├────────────────────────────────┤            ├────────────────────────────────┤            ├────────────────────────────────┤
│ • Fleet Control Room & Map     │            │ • Driver Daily Shift Checklist │            │ • Resident Online Invoice Pay  │
│ • Live Google Maps Truck Pin   │            │ • Odometer Logging (Start/End) │            │ • Pickup Schedule Calendar     │
│ • Route Replay & Speeding Log  │            │ • GPS Checkpoint + S3 Photo    │            │ • Waste Complaint Filing       │
│ • CFO Reports & Billing Audit  │            │ • Emergency Breakdown Alert    │            │ • Eco-Rewards Wallet Balance   │
└────────────────────────────────┘            └────────────────────────────────┘            └────────────────────────────────┘
```

---

### 3.1 💻 Portal #1: Admin & Operations Web Portal (React / Next.js)

Target Users: Fleet Managers, CFOs, City Sanitation Officers, Billing Managers.

#### Key Pages & Endpoint Mapping:

1. **Dashboard & Summary Analytics**:
   - `GET /dashboard`: Aggregated city metrics, total active trucks, total collections, complaint resolution rate.
2. **Live GIS Control Room**:
   - `GET /gis/active-fleet-map`: Active trucks on map, current speed, route progress.
   - `GET /gis/journey-replay/:dispatchId`: Historical route playback with GPS breadcrumb trail.
   - `GET /gis/journey-timeline/:dispatchId`: Chronological event timeline (shift start, pickups, speeding alerts >60 km/h, breakdowns).
3. **Financial Billing & Invoice Approval**:
   - `GET /billing/invoices`: Paginated invoice ledger with status badges (`DRAFT`, `ISSUED`, `PAID`, `OVERDUE`).
   - `PATCH /billing/invoices/:id/approve`: Maker-Checker invoice approval workflow.
   - `POST /billing/tariffs`: Create flat-rate, weight-based, or volume-based billing tariffs.
4. **Executive Analytics & CSV Export Center**:
   - `GET /reports/financial-aging`: Invoice aging buckets (Current, 1-30 days, 31-60 days, 90+ days overdue).
   - `GET /reports/fuel-efficiency`: Fleet km/L efficiency & fuel cost per ton of waste collected.
   - `GET /reports/waste-segregation`: % Organic vs % Recyclable waste & City Segregation Grade.
   - `POST /queues/report-exports`: Enqueues heavy CSV export job in BullMQ ➔ Polls `GET /queues/jobs/:jobId` for download link.
5. **Site & SLA Settings Configurator**:
   - `GET /sites/:siteId/settings`: View society SLA hours (`highPrioritySlaHours`, `lowPrioritySlaHours`).
   - `PATCH /sites/:siteId/settings`: Update custom SLA hours for a specific housing society.

---

### 3.2 📱 Portal #2: Driver Mobile App (React Native / Flutter / iOS & Android)

Target Users: Compactor Truck Drivers & Sanitation Crews.

#### Key Screens & Flow Sequence:

```
[Driver Login] ──► [View Today's Shift] ──► [Start Shift + Enter Odometer] ──► [Log Pickup Checkpoints + S3 Photo] ──► [Complete Shift]
```

1. **Today's Assigned Shift**:
   - `GET /driver-app/my-today-shifts`: Retrieves today's assigned truck, route stops, and shift checklist.
2. **Start Shift & Odometer**:
   - `POST /driver-app/shifts/:dispatchId/start`: Submits starting odometer reading (`45,210 km`) & safety checklist.
3. **Log Stop Checkpoints**:
   - `POST /storage/presigned-url`: Gets S3 upload link for bin pickup photo.
   - `POST /driver-app/shifts/:dispatchId/stop-checkpoint`: Submits pickup stop GPS, waste weight (`125.5 kg`), category, and photo URL.
4. **Emergency Breakdown**:
   - `POST /driver-app/emergency-breakdown`: Reports flat tire/engine failure, marks truck `UNDER_MAINTENANCE`, and sends urgent alert to control room.
5. **Finish Shift**:
   - `POST /driver-app/shifts/:dispatchId/complete`: Enters ending odometer (`45,285 km`). Returns total km driven & waste tonnage collected summary.

---

### 3.3 🏠 Portal #3: Resident & Housing Society Self-Service Portal

Target Users: Apartment Residents, Homeowners, and Society Treasurers.

#### Key Features & Endpoint Mapping:

1. **Property & Unit Link**:
   - `GET /resident-portal/my-unit-details`: Flat number, building name, society name, and management contacts.
2. **Pickup Schedule Calendar & Live Truck Pin**:
   - `GET /resident-portal/schedules`: Daily pickup times & waste category instructions.
   - `GET /gis/active-fleet-map`: Displays live truck pin moving toward resident's society with ETA.
3. **Monthly Invoices & Online Payment**:
   - `GET /resident-portal/invoices`: View pending bills and past receipts.
   - `PATCH /billing/invoices/:id/pay`: Pay invoice via Credit Card / UPI / NetBanking ➔ Status updates to `PAID`.
   - `GET /billing/invoices/:id/pdf`: Download official invoice PDF receipt.
4. **Waste Complaints & SLA Tracking**:
   - `POST /resident-portal/complaints`: File complaint for missed pickup with photo upload.
   - `GET /resident-portal/complaints`: Track resolution status (**`OPEN` ➔ `IN_PROGRESS` ➔ `RESOLVED`** with worker proof photo).

---

## 📡 4. Real-Time WebSocket GIS & Notification Contracts

The frontend connects to the Socket.IO server at `ws://localhost:7001` passing the JWT token in auth handshake:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:7001', {
  auth: {
    token: 'YOUR_JWT_ACCESS_TOKEN'
  }
});
```

### 4.1 Driver GPS Location Emission (Every 5 seconds)
Driver Mobile App emits location updates to server:

```javascript
socket.emit('driver:location_update', {
  dispatchId: 101,
  vehicleId: 5,
  latitude: 19.0760,
  longitude: 72.8777,
  speedKmH: 42.5,
  heading: 180.0
});
```

### 4.2 Admin Control Room Fleet Stream (Listening)
Admin Web Portal joins room `org:1:fleet` and listens for moving truck updates:

```javascript
socket.on('fleet:location_updated', (data) => {
  console.log(`Truck #${data.vehicleId} moved to ${data.latitude}, ${data.longitude} at ${data.speedKmH} km/h`);
});

// Speeding Alert Warning (> 60 km/h)
socket.on('fleet:speeding_alert', (alert) => {
  console.warn(`SPEEDING ALERT: Driver #${alert.driverUserId} exceeded 60 km/h! Speed: ${alert.speedKmH} km/h`);
});
```

---

## 📬 5. Async BullMQ Job Queues (Heavy CSV/PDF Exports)

For exporting large datasets without UI timeouts:

1. **Enqueue Export**:
   `POST /queues/report-exports`
   ```json
   {
     "reportType": "waste-collections",
     "format": "csv"
   }
   ```
   **Response (< 10ms)**:
   ```json
   {
     "message": "Report export job queued successfully",
     "jobId": "job_101",
     "status": "QUEUED"
   }
   ```

2. **Poll Status Every 2 Seconds**:
   `GET /queues/jobs/job_101`
   **Response**:
   ```json
   {
     "jobId": "job_101",
     "state": "completed",
     "progress": 100,
     "result": {
       "recordCount": 5420,
       "downloadUrl": "https://waste-management-exports.s3.amazonaws.com/reports/waste-collections_job_101.csv"
     }
   }
   ```

---

## 🗺️ 6. Complete Endpoint Sitemap & Module Summary

| Module | Base Path | Key UI Responsibilities |
| :--- | :--- | :--- |
| **Auth** | `/auth` | Login, Registration, Token Refresh, User Profile |
| **Sites** | `/sites` | Society Sites CRUD, Google Places Address Autocomplete |
| **Site Settings** | `/sites/:siteId/settings` | Custom SLA Threshold Hours (High / Low priority rules) |
| **Buildings** | `/buildings` | Towers / Blocks Management |
| **Floors** | `/floors` | Building Floors Management |
| **Units** | `/units` | Flats & Commercial Units Management |
| **Residents** | `/residents` | Resident Directory & Property Mapping |
| **Employees** | `/employees` | Sanitation Workers, Drivers & Staff Management |
| **Vehicles** | `/vehicles` | Compactor Trucks Fleet Management & Maintenance |
| **Compliance** | `/compliance` | PUC, Driving License & Insurance Document Audits |
| **Dispatches** | `/dispatches` | Shift Routing, Driver Assignments & Stop Logs |
| **Schedules** | `/schedules` | Pickup Route Calendar & Frequencies |
| **Complaints** | `/complaints` | Complaint SLA Resolution Engine & Escalations |
| **Billing** | `/billing` | Tariffs, Invoices Ledger, Payment Receipts & PDFs |
| **Reports** | `/reports` | Financial Aging, Fuel Efficiency, Segregation Grade, CSVs |
| **Driver App** | `/driver-app` | Mobile Driver Shifts, Odometer, Checkpoints, Breakdown |
| **Resident Portal** | `/resident-portal` | Resident Unit Info, Schedules, Invoice Payment, Tickets |
| **GIS** | `/gis` | Live Google Maps Fleet Pin Tracking & Route Replay |
| **Queues** | `/queues` | BullMQ Async Export Jobs & Status Polling |
| **Vendor API** | `/vendor-api` | Partner API Key Integration (`X-API-KEY`) |
| **Storage** | `/storage` | AWS S3 Presigned Upload Links |

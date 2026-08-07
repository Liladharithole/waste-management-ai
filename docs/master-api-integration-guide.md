# 📘 Master API Integration Guide & System Contract

## Waste Management AI Platform (Enterprise Edition)

Welcome to the **Master API Integration Guide** for the Waste Management AI Platform. This authoritative document provides complete, production-ready specifications, endpoint contracts, payload schemas, and step-by-step integration workflows for **Mobile Developers (Driver App), Web Developers (Admin & Resident Portals), and External Municipal / Partner Systems**.

---

## 🏛️ 1. Architecture & Dual-Database Contract

The platform runs a high-performance **NestJS 11** backend powered by two isolated MySQL 8.0 databases, Redis Pub/Sub caching, AWS S3 storage, and Socket.IO real-time WebSockets.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           BACKEND ENGINE SERVER                          │
│                                                                          │
│  🔒 Auth Guard  │  🛡️ RBAC Guard  │  🔑 API Key Guard  │  ⚡ WebSockets   │
└──────┬────────────────────────────────────────────────────────────┬──────┘
       │                                                            │
       ▼                                                            ▼
┌───────────────────────────────┐          ┌────────────────────────────────┐
│   central_core_db (MySQL 8.0) │          │  waste_management (MySQL 8.0)  │
├───────────────────────────────┤          ├────────────────────────────────┤
│ • Users, Profiles, Addresses  │          │ • Waste Categories & Pickups   │
│ • Roles, Permissions, Auth    │          │ • Waste Schedules & Tariffs    │
│ • Orgs, Sites, Buildings      │          │ • Invoices & Line Items        │
│ • Units, Residents, Employees │          │ • Fleet Vehicles & Dispatches  │
│ • Compliance & Cron Audit Logs│          │ • Dispatch Stop Logs & GPS     │
└───────────────────────────────┘          └────────────────────────────────┘
```

---

## 🔒 2. Authentication & Authorization Contract

### Authentication Flow

1. All requests pass JWT Bearer token in the HTTP Header:
   `Authorization: Bearer <JWT_ACCESS_TOKEN>`
2. WebSocket connections pass token in handshake auth:
   `socket = io('http://localhost:7001', { auth: { token: 'Bearer <TOKEN>' } })`
3. Vendor API calls pass partner key in header:
   `X-API-KEY: wm_live_partner_key_2026`

### Role-Based Access Control (RBAC)

The system enforces **84 permissions** across 18 resource domains (format: `resource:action`). Example permissions:

- `dispatches:view`, `dispatches:create`, `dispatches:update`, `dispatches:assign`
- `vehicles:view`, `vehicles:create`, `vehicles:update`, `vehicles:delete`
- `invoices:view`, `invoices:create`, `invoices:approve`, `invoices:update`

---

## 📱 3. Driver Mobile App Workflow (`/driver-app`)

The Driver Mobile App enables truck drivers to complete daily waste pickup shifts, log odometer readings, record GPS stop checkpoints, upload S3 photo proofs, and report emergency breakdowns.

### Complete Mobile Driver Journey

```mermaid
sequenceDiagram
    autonumber
    actor Driver as 👨‍✈️ Driver Mobile App
    participant API as 🚀 NestJS Backend (/driver-app)
    participant S3 as ☁️ AWS S3 Presigned URL
    participant Socket as ⚡ WebSocket Gateway

    Driver->>API: 1. POST /auth/login -> Receive JWT Token
    Driver->>API: 2. GET /driver-app/my-today-shifts -> Fetch today's truck & route stops
    Driver->>API: 3. POST /driver-app/shifts/:id/start -> Start shift + Log start odometer (45,210 km)

    loop Active Route Driving
        Driver->>Socket: 4. emit('driver:location_update', { lat, lng, speed })
        Driver->>S3: 5. POST /storage/presigned-url -> Upload pickup photo proof
        Driver->>API: 6. POST /driver-app/shifts/:id/stop-checkpoint -> Log weight (125 kg) + GPS + Photo URL
    end

    alt Emergency Breakdown Scenario
        Driver->>API: 7. POST /driver-app/emergency-breakdown -> Report flat tire / breakdown
    else Normal Shift Completion
        Driver->>API: 8. POST /driver-app/shifts/:id/complete -> Log end odometer (45,285 km)
    end
```

### Driver API Payload Schemas

#### A. Start Shift (`POST /driver-app/shifts/:dispatchId/start`)

```json
{
  "startOdometerKm": 45210,
  "vehicleSafetyCheckPassed": true,
  "inspectionNotes": "Brakes, lights, and tire pressure verified"
}
```

#### B. Log Route Stop Checkpoint (`POST /driver-app/shifts/:dispatchId/stop-checkpoint`)

```json
{
  "siteId": 1,
  "unitId": 5,
  "collectedWeightKg": 125.5,
  "latitude": 18.520412,
  "longitude": 73.856743,
  "status": "COMPLETED",
  "photoUrl": "https://waste-bucket.s3.ap-south-1.amazonaws.com/pickup1.jpg"
}
```

#### C. Emergency Breakdown (`POST /driver-app/emergency-breakdown`)

```json
{
  "dispatchId": 10,
  "breakdownType": "FLAT_TIRE",
  "latitude": 18.520412,
  "longitude": 73.856743,
  "notes": "Rear right tire punctured on Highway 4",
  "photoUrl": "https://waste-bucket.s3.ap-south-1.amazonaws.com/tire.jpg"
}
```

---

## 💻 4. Admin Web Portal Workflow (GIS Map & Operations)

Fleet Managers log into the Admin Web Portal to manage vehicles, dispatch shifts, review compliance, and monitor live truck movements.

### Live GIS WebSocket Integration

- **Socket Connection**: `http://localhost:7001`
- **Subscribe Event**: `socket.emit('subscribe:fleet_map', { organizationId: 1 })`
- **Broadcast Event**: `socket.on('fleet:location_changed', (data) => ...)`

```json
{
  "dispatchId": 10,
  "vehicleId": 1,
  "registrationNumber": "MH-12-AB-1234",
  "vehicleType": "COMPACTOR_TRUCK",
  "organizationId": 1,
  "targetOrgIds": [1, 2],
  "driverName": "John Doe",
  "latitude": 18.520412,
  "longitude": 73.856743,
  "speedKmH": 35.5,
  "heading": 180.0,
  "etaToNextTargetSite": {
    "distanceKm": 3.5,
    "etaMinutes": 8,
    "etaTimestamp": "2026-08-08T04:10:00.000Z"
  },
  "timestamp": "2026-08-08T04:02:00.000Z"
}
```

---

## 🔑 5. Third-Party Vendor & Municipal API Gateway (`/vendor-api`)

Allows external Government software or Partner logistics portals to fetch metrics using API Keys.

### Request Headers

```http
GET /vendor-api/waste-metrics HTTP/1.1
Host: localhost:7001
X-API-KEY: wm_live_partner_key_2026
```

### Response Schema (`GET /vendor-api/waste-metrics`)

```json
{
  "partnerPortal": "Municipal & Vendor Partner Gateway",
  "totalCollectionsCount": 142,
  "totalWeightKg": 18450.5,
  "totalWeightTons": 18.45,
  "categoryBreakdown": [
    { "category": "Wet Waste", "weightKg": 11000.0, "weightTons": 11.0 },
    { "category": "Dry Waste", "weightKg": 6450.5, "weightTons": 6.45 },
    { "category": "E-Waste", "weightKg": 1000.0, "weightTons": 1.0 }
  ],
  "timestamp": "2026-08-08T04:00:00.000Z"
}
```

---

## 🗺️ 6. Complete API Sitemap

| Category          | Endpoint                                 | Method  | Permission / Guard     | Description                                                    |
| :---------------- | :--------------------------------------- | :------ | :--------------------- | :------------------------------------------------------------- |
| **Auth**          | `/auth/login`                            | `POST`  | Public                 | Authenticates user & returns JWT tokens.                       |
| **Auth**          | `/auth/refresh`                          | `POST`  | Public                 | Refreshes expired access tokens.                               |
| **Driver App**    | `/driver-app/my-today-shifts`            | `GET`   | `dispatches:view`      | Returns today's assigned shift schedules for logged-in driver. |
| **Driver App**    | `/driver-app/my-profile`                 | `GET`   | `employees:view`       | Returns driver profile & commercial license status.            |
| **Driver App**    | `/driver-app/history-summary`            | `GET`   | `dispatches:view`      | Returns driver past completed shift stats & km driven.         |
| **Driver App**    | `/driver-app/shifts/:id/start`           | `POST`  | `dispatches:update`    | Starts shift & logs starting odometer reading.                 |
| **Driver App**    | `/driver-app/shifts/:id/stop-checkpoint` | `POST`  | `dispatches:update`    | Logs pickup checkpoint (GPS, weight, S3 photo proof).          |
| **Driver App**    | `/driver-app/shifts/:id/complete`        | `POST`  | `dispatches:update`    | Completes shift & logs ending odometer reading.                |
| **Driver App**    | `/driver-app/emergency-breakdown`        | `POST`  | `dispatches:update`    | Reports vehicle breakdown & marks truck UNDER_MAINTENANCE.     |
| **GIS Live**      | `/gis/active-fleet-map`                  | `GET`   | `dashboard:view`       | Returns active fleet live GPS coordinates & ETAs.              |
| **GIS Live**      | `/gis/shift-route-progress/:id`          | `GET`   | `dashboard:view`       | Returns route stop progress & collected weight for a shift.    |
| **Notifications** | `/notifications`                         | `GET`   | `notifications:view`   | Returns paginated in-app notifications for authenticated user. |
| **Notifications** | `/notifications/unread-count`            | `GET`   | `notifications:view`   | Returns unread notification badge count.                       |
| **Notifications** | `/notifications/:id/read`                | `PATCH` | `notifications:update` | Marks specific notification as read.                           |
| **Notifications** | `/notifications/send`                    | `POST`  | `notifications:create` | Triggers real-time notification (Socket + Email).              |
| **Vendor API**    | `/vendor-api/waste-metrics`              | `GET`   | `X-API-KEY`            | Returns city-wide waste tonnage stats for partners.            |
| **Vendor API**    | `/vendor-api/fleet-status`               | `GET`   | `X-API-KEY`            | Returns fleet availability & compliance stats.                 |
| **Storage**       | `/storage/presigned-url`                 | `POST`  | Authenticated          | Generates AWS S3 presigned URL for direct photo uploads.       |
| **Reports**       | `/reports/export/waste-collections.csv`  | `GET`   | `reports:view`         | Downloads waste collections CSV report.                        |
| **Reports**       | `/reports/export/invoices.csv`           | `GET`   | `reports:view`         | Downloads invoices ledger CSV report.                          |

---

## 🛠️ 7. Environment Variables Reference

```env
PORT=7001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DATABASE_URL="mysql://root:root%401234@localhost:3306/waste_management"
CENTRAL_CORE_DATABASE_URL="mysql://root:root%401234@localhost:3306/central_core_db"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET="your-jwt-secret-key"
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
AWS_REGION="ap-south-1"
AWS_S3_BUCKET_NAME="waste-management-ai-bucket"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
VENDOR_API_KEY="wm_live_partner_key_2026"
```

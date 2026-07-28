# Timezone Handling & Localization Standards

## 🌍 The Industry Gold Standard

To build robust, globally compliant applications, big companies (like Google, Netflix, and Amazon) follow the **UTC-Everywhere** pattern:

1. **Storage (Database)**: Always store all timestamps in **UTC** (Coordinated Universal Time).
2. **Transfer (API)**: Always transfer datetimes in **ISO 8601 UTC strings** (e.g., `"2026-07-28T06:57:12.000Z"`).
3. **Display (Client/Frontend)**: The browser/mobile client reads the UTC string and automatically converts it to the user's local timezone (e.g., IST, EST) based on their operating system.

---

## 🛠️ How it is Managed in our Project

### 1. Database Layer (Prisma & MySQL)

Prisma automatically handles date fields as JS `Date` objects. By default, when a database query runs, Prisma stores datetimes in UTC:

```prisma
model WasteRecord {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now()) // Automatically sets UTC time
  updatedAt DateTime @updatedAt      // Automatically updates in UTC
}
```

### 2. API Layer (NestJS Response)

When returning datetimes from NestJS controllers, serialize them as standard ISO 8601 strings. This format includes the `"Z"` suffix, which explicitly instructs the client that the time is in UTC:

```json
{
  "id": "16c5f9f7-15e2-418b-bfd1-74a22042fda3",
  "createdAt": "2026-07-28T06:57:12.000Z"
}
```

### 3. Frontend Layer (Next.js / Browser)

When your Next.js application receives this timestamp, JavaScript's native `Date` object instantly converts it to the user's local system time (e.g., IST in India, PST in California):

```typescript
// 1. Parse the UTC string from the API:
const utcString = '2026-07-28T06:57:12.000Z';
const date = new Date(utcString);

// 2. Display localized time automatically:
console.log(date.toLocaleString());
// In India: "28/7/2026, 12:27:12 pm" (IST)
// In New York: "28/7/2026, 2:27:12 am" (EST)
```

---

## 📦 Recommended Backend Library: `luxon`

If the backend needs to perform timezone-specific operations (e.g. generating reports for a specific timezone, or running cron jobs at exactly midnight in India), install **`luxon`**:

```bash
npm install luxon
npm install --save-dev @types/luxon
```

### Example Usage:

```typescript
import { DateTime } from 'luxon';

// Create a date in UTC:
const nowInUtc = DateTime.utc();

// Convert to India Standard Time (IST) on the backend:
const nowInIst = nowInUtc.setZone('Asia/Kolkata');
console.log(nowInIst.toString()); // Displays in IST offset (+05:30)
```

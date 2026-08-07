# API Design & Contract Rules

## 🌐 RESTful API Standards

- **Resource-Oriented URLs**: Use plural nouns for endpoints (`/api/v1/waste-records`, not `/api/v1/getWasteRecords`).
- **HTTP Verbs**:
  - `GET`: Retrieve resource(s).
  - `POST`: Create a new resource.
  - `PUT`: Replace an existing resource entirely.
  - `PATCH`: Update specific fields of an existing resource.
  - `DELETE`: Remove a resource.

---

## 🔒 Input Validation & DTOs

- Every request payload must be validated using `class-validator` and `class-transformer` DTOs.
- The NestJS `ValidationPipe` is registered globally in [main.ts](file://../src/main.ts) with `whitelist: true`, `transform: true`, and `forbidNonWhitelisted: true` to enforce strict payloads and prevent mass assignment vulnerabilities.
- Provide descriptive validation decorators and user-friendly error messages on all DTO properties.

### DTO Contract for AI-Generated Code

Every new or modified DTO must:

- Use `@ApiProperty` or `@ApiPropertyOptional` for Swagger documentation.
- Validate numeric IDs as positive integers.
- Validate required strings with non-empty and length constraints.
- Reject whitespace-only required strings when business meaning requires actual content.
- Validate latitude and longitude with proper coordinate bounds.
- Validate enums with explicit allowed values.
- Avoid accepting trusted system fields from clients, including `createdBy`, `updatedBy`, `deletedBy`, privileged `status`, role escalation fields, or permission escalation fields unless the user explicitly approves the API contract.
- Use DTO-level examples that match the actual domain (`organization`, `site`, `building`, `floor`, `unit`, `waste category`, `waste collection`) instead of generic placeholder data.

```typescript
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateWasteRecordDto {
  @IsString()
  @IsNotEmpty({ message: 'Category is required' })
  category: string;

  @IsNumber()
  @Min(0, { message: 'Weight must be at least 0 kg' })
  weightKg: number;
}
```

---

## 🚦 API Rate Limiting (Throttling)

We protect all application endpoints from DDoS attacks, brute-force hacking, and third-party API budget drain using `@nestjs/throttler` (registered globally in [app.module.ts](file://../src/app.module.ts)).

### 1. Global Defaults (Configurable via `.env`)

- `THROTTLE_TTL` — Time window size in milliseconds (Default: `60000` / 1 minute).
- `THROTTLE_LIMIT` — Max allowed requests per window (Default: `100` requests).

### 2. Custom Overrides

Use the `@Throttle()` decorator to apply stricter rules:

- **Authentication Protection** (`/auth/login`, `/auth/register`): Stricter limit of **5 requests per minute** to prevent brute-force attacks.
- **Google Maps Autocomplete** (`/address-suggestions`): Stricter limit of **15 requests per minute** to control API key usage costs.

---

## ⚡ API Caching Standards

To optimize performance and minimize database query load or third-party API costs, follow these caching principles:

### 1. Cache GET Requests Only

- **Rule**: Only cache safe, read-only requests (`GET` endpoints) that are slow, expensive, or change infrequently.
- **Never Cache Write Operations**: Never cache `POST`, `PUT`, `PATCH`, or `DELETE` requests. These must always interact directly with the database in real-time.

### 2. Mandatory Cache Invalidation (Syncing RAM & DB)

- **Rule**: Whenever a write operation occurs (`POST`, `PATCH`, or `DELETE`), the corresponding cached key(s) in RAM **must be wiped (deleted)** immediately.
- **Sequence**:
  1. Write the update to the MySQL database.
  2. Invalidate (delete) the cache keys in RAM.
  3. The next `GET` request will result in a cache miss, fetch fresh data from the database, and write the updated state to the cache.

---

## 📦 Response & Error Envelopes

- Errors must pass through [`AllExceptionsFilter`](file://./src/common/filters/all-exceptions.filter.ts) to return a consistent JSON response:

```json
{
  "statusCode": 400,
  "message": "weightKg must not be less than 0",
  "path": "/api/v1/waste-records",
  "requestId": "req-12345"
}
```

- Never return raw database stack traces to API clients in production environments.

---

## 🛠️ Meaningful Error Handling & Debugging

To ensure debugging is fast, clear, and painless, follow these error handling rules:

1. **Meaningful Error Messages**:
   - Never return generic messages like `"Something went wrong"` or `"Query failed"`.
   - Return precise, context-aware error messages (e.g., `"Bin with ID 456 is already full"`, `"Cannot allocate driver: Driver is on another route"`).
   - For database constraint violations (e.g., duplicate entries), catch the error and translate it into a readable client message (e.g., `"Email address already registered"`, not `"PrismaClientKnownRequestError: Unique constraint failed..."`).

2. **Accurate HTTP Status Codes**:
   - `400 Bad Request`: Input validation failed, malformed JSON, or invalid business payload.
   - `401 Unauthorized`: Authentication missing or invalid.
   - `403 Forbidden`: Authenticated, but user lacks correct roles/permissions.
   - `404 Not Found`: Resource does not exist.
   - `409 Conflict`: Resource state conflict (e.g., duplicate key, concurrent modification).
   - `500 Internal Server Error`: True server-side crashes/unexpected failures.

3. **Log the Original Stack Trace**:
   - Always log the complete stack trace for server-side exceptions internally using `this.logger.error()` along with the unique `requestId` before mapping to an HTTP response.
   - Never let errors fail silently.

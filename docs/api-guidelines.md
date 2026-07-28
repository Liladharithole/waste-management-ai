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
- Use `ValidationPipe` globally with `whitelist: true` and `forbidNonWhitelisted: true` to prevent mass assignment vulnerabilities.

```typescript
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateWasteRecordDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  @Min(0)
  weightKg: number;
}
```

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

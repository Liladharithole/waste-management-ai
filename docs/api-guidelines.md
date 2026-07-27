# API Design & Contract Rules

## 🌐 RESTful API Standards

* **Resource-Oriented URLs**: Use plural nouns for endpoints (`/api/v1/waste-records`, not `/api/v1/getWasteRecords`).
* **HTTP Verbs**:
  * `GET`: Retrieve resource(s).
  * `POST`: Create a new resource.
  * `PUT`: Replace an existing resource entirely.
  * `PATCH`: Update specific fields of an existing resource.
  * `DELETE`: Remove a resource.

---

## 🔒 Input Validation & DTOs

* Every request payload must be validated using `class-validator` and `class-transformer` DTOs.
* Use `ValidationPipe` globally with `whitelist: true` and `forbidNonWhitelisted: true` to prevent mass assignment vulnerabilities.

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

* Errors must pass through [`AllExceptionsFilter`](file://./src/common/filters/all-exceptions.filter.ts) to return a consistent JSON response:
```json
{
  "statusCode": 400,
  "message": "weightKg must not be less than 0",
  "path": "/api/v1/waste-records",
  "requestId": "req-12345"
}
```
* Never return raw database stack traces to API clients in production environments.

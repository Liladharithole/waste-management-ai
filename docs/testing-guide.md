# Testing Strategy & Mandatory Scenarios

## 🧪 Testing Requirements

Every feature added or modified MUST include test coverage across multiple levels:

- **Unit Tests**: Test individual functions, utility helpers, and service methods in isolation using mocks.
- **Integration Tests**: Verify interaction between NestJS modules, database services, and external APIs.
- **End-to-End (E2E) Tests**: Test complete request-response HTTP flows (`/test/app.e2e-spec.ts`).
- **Regression Tests**: Ensure bug fixes include a regression test preventing recurrence.

---

## 🔬 Autonomous AI Real-World Edge Case Testing

The AI Agent must autonomously design and execute real-world edge-case tests before marking any feature complete:

### 1. Data Integrity & Boundary Extremes

- [ ] **Type Coercion & Malformed Data**: Passing strings where numbers are expected, object payloads where arrays are expected, or malformed JSON.
- [ ] **Boundary Limits**: Maximum character length strings, negative numbers, floating-point precision issues, empty strings `""`, and whitespace-only strings.
- [ ] **Null/Undefined Cascades**: Missing optional fields in DTOs, null values in database foreign keys, and undefined properties in nested objects.
- [ ] **Duplicate Requests & Idempotency**: Submitting identical creation payloads rapidly to test unique constraint handling.

### 2. Concurrency & Race Conditions

- [ ] **Simultaneous Mutations**: Two concurrent requests attempting to update the same record or modify state simultaneously.
- [ ] **Transaction Atomicity**: Ensuring multi-step database writes roll back completely if an error occurs mid-transaction.

### 3. Security & Access Control

- [ ] **Authentication Edge Cases**: Expired JWTs, corrupted signature tokens, missing Bearer headers, and forged role claims.
- [ ] **Injection & Sanitization**: Strings containing `<script>` tags, SQL escape sequences, or regex-denial-of-service payloads.

### 4. System Resilience & Failures

- [ ] **Database Connection Interruptions**: Graceful handling and error responses when the database connection drops or times out.
- [ ] **Rate Limit & Throttle Thresholds**: Exceeding allowed request limits returns standard HTTP 429 Too Many Requests.

---

## 🏃 Running Tests

```bash
# Unit Tests
npm run test

# Watch Mode
npm run test:watch

# Test Coverage Report
npm run test:cov

# End-to-End Tests
npm run test:e2e
```

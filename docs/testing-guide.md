# Testing Strategy & Mandatory Scenarios

## 🧪 Testing Requirements

Every feature added or modified MUST include test coverage across multiple levels:
* **Unit Tests**: Test individual functions, utility helpers, and service methods in isolation using mocks.
* **Integration Tests**: Verify interaction between NestJS modules, database services, and external APIs.
* **End-to-End (E2E) Tests**: Test complete request-response HTTP flows (`/test/app.e2e-spec.ts`).
* **Regression Tests**: Ensure bug fixes include a regression test preventing recurrence.

---

## ✅ Mandatory Testing Matrix

For every feature or endpoint, verify and test the following scenarios:

### Input & Data Variations
- [ ] **Happy Path**: Valid input yields expected output and HTTP 200/201.
- [ ] **Invalid Input**: Out-of-range or malformed data yields HTTP 400 Bad Request.
- [ ] **Empty Input**: Empty strings, empty arrays, or empty request body.
- [ ] **Null & Undefined**: Missing optional parameters or null values.
- [ ] **Missing Fields**: Payloads missing required DTO parameters.
- [ ] **Large Payloads**: Extra large inputs testing memory and buffer handling.
- [ ] **Duplicates**: Submitting duplicate data where uniqueness is required.

### Security & Auth Scenarios
- [ ] **Unauthorized**: Requests missing authentication tokens yield HTTP 401.
- [ ] **Forbidden**: Users with insufficient role privileges yield HTTP 403.
- [ ] **Expired / Invalid Tokens**: Malformed or expired JWTs are rejected.
- [ ] **XSS & SQL Injection**: Malicious script strings and SQL escape attempts are safely handled.

### Reliability & Resilience
- [ ] **Race Conditions & Concurrency**: Simultaneous requests updating the same entity.
- [ ] **Database & Network Failure**: Proper error catching when database connections drop.
- [ ] **Timeouts & Retries**: Handling slow third-party services gracefully.
- [ ] **Rate Limiting**: Exceeding allowed request thresholds yields HTTP 429.

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

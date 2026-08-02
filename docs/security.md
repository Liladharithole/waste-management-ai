# Security Standards & Rules

## 🛡️ Core Security Directives

### 1. Input Validation & Zero Trust

- **Never trust client input**. Validate every string, number, array, and file upload before processing.
- Sanitize user input to prevent Cross-Site Scripting (XSS) attacks.
- Use parameterized queries via Prisma ORM to eliminate SQL injection vulnerabilities.

### 2. Authentication & Authorization

- Protect endpoints using appropriate Auth Guards and Role Guards.
- Use secure, HTTP-only cookies for session/refresh tokens.
- Enforce the **Principle of Least Privilege**: Users and database roles must only have access to resources strictly required for their tasks.

### 3. Secret Management

- **Never hardcode secrets**, API keys, or database credentials in source code.
- Store all configuration secrets in `.env` files and access them via `ConfigService` or `process.env`.
- Keep `.env` git-ignored at all times. Use `.env.example` to document keys safely.

### 4. Cross-Origin & Request Safety

- Configure CORS explicitly in [`main.ts`](file://./src/main.ts). Do not use wildcard `*` origins in production when `credentials: true`.
- Protect against CSRF attacks.
- Strip internal server headers (e.g. `X-Powered-By`).

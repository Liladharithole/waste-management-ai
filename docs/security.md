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

#### Permission Naming Contract

All permission strings must follow this exact format:

```text
resource:action
```

Allowed actions:

- `view`
- `create`
- `update`
- `delete`
- `assign`
- `revoke`

Do **not** invent broad or wildcard permissions such as:

- `resource:manage`
- `resource:admin`
- `resource:*`

Before adding or changing a `@RequirePermissions()` decorator, verify that the exact permission exists in [`prisma/permissions.ts`](file://../prisma/permissions.ts). If the permission does not exist, stop and propose whether to add the new permission to the seed list or use an existing granular permission.

Recommended endpoint mapping:

- `GET` routes use `resource:view`.
- `POST` create routes use `resource:create`.
- `PATCH` routes use `resource:update`.
- `DELETE` routes use `resource:delete`.
- Role/permission assignment routes use `resource:assign`.
- Role/permission revocation routes use `resource:revoke`.

`SUPER_ADMIN` bypass behavior may exist in guards, but regular role access must still be backed by explicit seeded permissions.

### 3. Secret Management

- **Never hardcode secrets**, API keys, or database credentials in source code.
- Store all configuration secrets in `.env` files and access them via `ConfigService` or `process.env`.
- Keep `.env` git-ignored at all times. Use `.env.example` to document keys safely.

### 4. Cross-Origin & Request Safety

- Configure CORS explicitly in [`main.ts`](file://./src/main.ts). Do not use wildcard `*` origins in production when `credentials: true`.
- Protect against CSRF attacks.
- Strip internal server headers (e.g. `X-Powered-By`).

# Code Quality Gates & Review Checklists

## 🔍 Mandatory AI Code Self-Review (Post-Implementation)

After generating or editing code, the AI Agent must execute a thorough self-review against the following gates before marking work complete:

### 1. Code Review & Logic Audit

- [ ] Review every modified/added line for syntax errors, missing imports, or typos.
- [ ] Ensure no side effects or unintended modifications were introduced.
- [ ] Verify that logic is clean, self-documenting, and free of magic values.

### 2. Error Handling & Debuggability

- [ ] Ensure all try-catch blocks return descriptive, context-specific error messages.
- [ ] Verify that HTTP status codes are correct and correspond exactly to the error type.
- [ ] Ensure raw database errors or stack traces are caught and translated into user-friendly messages.
- [ ] Verify that internal errors log the full stack trace alongside the `requestId`.

### 3. Automated Pre-Commit (Husky & `lint-staged`)

- [ ] Husky pre-commit hooks are active (`.husky/pre-commit`).
- [ ] `lint-staged` automatically formats changed files (`prettier`) and runs ESLint (`eslint --fix`).

### 4. Code Quality & Linting

- [ ] Run TypeScript compiler check without errors.
- [ ] Run `npm run lint` and verify zero ESLint errors or warnings.
- [ ] Run `npm run format` (Prettier).
- [ ] Remove all `console.log`, temporary debug statements, and unused imports.
- [ ] Verify no dead code or commented-out logic remains.

### 5. Testing & Coverage

- [ ] Unit tests written and passing (`npm run test`).
- [ ] E2E tests written and passing (`npm run test:e2e`).
- [ ] Mandatory testing scenarios (happy path, null/undefined, error cases) verified.

### 6. Architecture & Principles

- [ ] SOLID, DRY, KISS, and YAGNI principles respected.
- [ ] Controllers remain thin; business logic resides strictly in Services.
- [ ] Database queries reside in `repositories/` (Prisma ORM for standard, Raw SQL for complex/optimized queries). Services call Repositories, never Prisma directly.
- [ ] New modules and major rewrites include a `repositories/` folder and do not inject Prisma clients directly into services.
- [ ] Existing direct-Prisma legacy services were not refactored unless that scope was explicitly approved.
- [ ] All inputs validated via DTOs and `class-validator`.
- [ ] No circular dependencies introduced.
- [ ] All dates/timestamps stored in UTC and transferred via API in ISO 8601 UTC strings.

### 7. Security & Performance

- [ ] Secrets and connection strings kept in `.env`.
- [ ] No SQL injection, XSS, or unhandled exception risks.
- [ ] Every `@RequirePermissions()` value exists exactly in `prisma/permissions.ts`.
- [ ] Permission names use granular `resource:action` format and do not invent broad `resource:manage` permissions.
- [ ] DELETE endpoints use soft delete for primary entities with `deletedAt`/`deletedBy`; hard delete is limited to approved cases or pure mapping tables.
- [ ] Cross-database links are scalar IDs only and are validated in application code.
- [ ] No N+1 database queries created.
- [ ] Database indexes added for new foreign keys or searched columns.

### 8. Documentation

- [ ] API endpoints documented in Swagger using appropriate decorators (@ApiTags, @ApiOperation, @ApiProperty).
- [ ] Environment variables updated in `.env.example` if new keys were introduced.
- [ ] [`AGENTS.md`](file://./AGENTS.md) or relevant `/docs` updated if architecture changed.

---

## 🧾 Final Response Requirements

After implementation, the AI Agent must clearly report:

- [ ] Files changed.
- [ ] Behavior changed.
- [ ] Test/build commands run.
- [ ] Whether verification passed.
- [ ] Any skipped verification and why.
- [ ] Remaining risks or follow-up work.

The AI Agent must not claim success without running the relevant verification commands.

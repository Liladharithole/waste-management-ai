# Code Quality Gates & Review Checklists

## 🔍 Pre-Commit / Pull Request Checklist

Before submitting a pull request or marking any task complete, verify each item:

### 1. Code Quality & Linting
- [ ] Run TypeScript compiler check without errors.
- [ ] Run `npm run lint` and verify zero ESLint errors or warnings.
- [ ] Run `npm run format` (Prettier).
- [ ] Remove all `console.log`, temporary debug statements, and unused imports.
- [ ] Verify no dead code or commented-out logic remains.

### 2. Testing & Coverage
- [ ] Unit tests written and passing (`npm run test`).
- [ ] E2E tests written and passing (`npm run test:e2e`).
- [ ] Mandatory testing scenarios (happy path, null/undefined, error cases) verified.

### 3. Architecture & Principles
- [ ] SOLID, DRY, KISS, and YAGNI principles respected.
- [ ] Controllers remain thin; business logic resides strictly in Services.
- [ ] Database queries reside in `repositories/` (Prisma ORM for standard, Raw SQL for complex/optimized queries). Services call Repositories, never Prisma directly.
- [ ] All inputs validated via DTOs and `class-validator`.
- [ ] No circular dependencies introduced.

### 4. Security & Performance
- [ ] Secrets and connection strings kept in `.env`.
- [ ] No SQL injection, XSS, or unhandled exception risks.
- [ ] No N+1 database queries created.
- [ ] Database indexes added for new foreign keys or searched columns.

### 5. Documentation
- [ ] API endpoints documented (purpose, input/output contract).
- [ ] Environment variables updated in `.env.example` if new keys were introduced.
- [ ] [`AGENTS.md`](file://./AGENTS.md) or relevant `/docs` updated if architecture changed.

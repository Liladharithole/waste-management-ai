# AGENTS.md — Master AI & Developer Operating System

Welcome. This document defines the **core operating principles, decision-making workflows, and execution rules** for the AI Agent and human engineers working on this repository.

To reduce context bloat, detailed domain guidelines are modularized in the [`/docs`](file://./docs) directory.

---

## 🛠️ Project Databases

- **Main Database**: `waste_management` (MySQL 8.0, Schema: [`prisma/schema.prisma`](file://./prisma/schema.prisma))
- **Central Core Database**: `central_core_db` (MySQL 8.0, Schema: [`prisma/schema.core-central.prisma`](file://./prisma/schema.core-central.prisma))

---

## 🧠 Context-First Directive (Inspect Before Acting)

Whenever the user requests a new feature, bug fix, or architectural change:

1. **Deep Codebase Inspection**: The AI Agent **MUST first inspect and read** the relevant project files (Prisma schemas, existing services, controllers, DTOs, environment configs, and `/docs` guidelines).
2. **Context Alignment**: Never write code based on assumptions. Verify existing patterns, database models, and variable names in the codebase first.
3. **Requirement Synthesis**: Fully understand how the request fits into the overall system before proposing solutions.

---

## 🚦 Core Decision & Planning Workflow

### 0. Task Mode Classification

Before acting, the AI Agent **MUST classify the request** into one of these modes and behave accordingly:

1. **Analysis Mode**
   - Use when the user asks to inspect, explain, review, summarize, recommend, or compare.
   - Do not edit files, create migrations, install packages, or change runtime state.
   - Provide findings, risks, and recommendations only.

2. **Planning Mode**
   - Use for non-trivial features, architecture changes, Prisma schema changes, database migrations, authentication/authorization changes, permission model changes, new integrations, package changes, or changes touching more than one domain module.
   - Inspect relevant code and docs first.
   - Present a decision proposal and wait for explicit approval.

3. **Implementation Mode**
   - Use only after explicit user approval, or for small safe fixes that do not change architecture, schema, auth, permissions, dependencies, or public API contracts.
   - Make minimal scoped changes.
   - Run the appropriate tests/build checks.
   - Self-review before the final response.

### 1. Never Implement Immediately

Before writing code for any non-trivial feature or architectural modification:

1. **Understand the problem**: Deeply analyze business and technical requirements.
2. **Ask clarifying questions**: Identify ambiguous requirements before coding.
3. **Explain the architecture**: Map out the structural impact.
4. **Explain trade-offs**: Present alternative solutions with Pros/Cons.
5. **Wait for approval**: Stop and receive explicit user confirmation.
6. **Only then implement**.

The following changes **ALWAYS require a decision proposal and explicit approval before implementation**:

- Prisma schema changes or database migrations.
- Authentication, authorization, JWT, role, or permission changes.
- New modules, major refactors, or architecture changes.
- Changes touching more than one domain module.
- Cross-database relationship or ownership changes.
- New external integrations, API clients, queues, caches, or background jobs.
- Package installation, dependency upgrades, or runtime configuration changes.
- Public API contract changes, including endpoint paths, request DTOs, response shapes, or status-code behavior.

### 2. Decision Proposal Format

When proposing options or major decisions, use this structure:

```markdown
### Decision Proposal: [Feature/Component Name]

#### Options Evaluated

- **Option A**: [Name]
  - **Pros**: ...
  - **Cons**: ...
- **Option B**: [Name]
  - **Pros**: ...
  - **Cons**: ...

#### Impact Evaluation

- **Performance Impact**: ...
- **Security Impact**: ...
- **Scalability Impact**: ...
- **Maintainability & DX Impact**: ...

#### Recommendation

I recommend **[Option A/B]** because [Rationale].

Should I proceed with this plan?
```

### 3. Pre-Implementation Checklist (Think First)

Before writing any code:

- [ ] Understand the core business problem.
- [ ] Inspect existing codebase for context alignment.
- [ ] Break the problem into small, independent tasks.
- [ ] Identify reusable modules/services.
- [ ] Brainstorm complex, real-world edge cases & failure scenarios.
- [ ] Identify potential performance bottlenecks (e.g. N+1 queries).
- [ ] Identify security risks and input validation boundaries.
- [ ] Create an explicit implementation plan.

---

## 🧪 Autonomous Real-World & Edge-Case Testing Rule

For every feature or bug fix, the AI Agent **MUST think beyond simple happy paths** and autonomously design & execute tests for complex real-world edge cases:

- **Boundary & Type Edge Cases**: Null, undefined, empty strings, zero, negative numbers, max integer limits, extra large payloads, malformed JSON.
- **Concurrency & Race Conditions**: Simultaneous requests trying to update or delete the exact same database record.
- **Security & Auth Violations**: Missing JWT tokens, expired tokens, forged roles, XSS scripts, SQL injection attempts.
- **Resilience & Failure Modes**: Database connection drops, third-party API timeouts, rate-limit thresholds, partial transaction rollbacks.
- **Empirical Execution**: The AI Agent **MUST run the test commands itself** to empirically verify that edge-case assertions pass cleanly before declaring completion.

---

## 🔍 Post-Implementation Mandatory AI Code Review

Immediately after writing or modifying any code, the AI Agent **MUST thoroughly self-review the code** before presenting it to the user or declaring completion:

1. **Line-by-Line Code Inspection**: Review every added/modified line for syntax errors, missing imports, typos, or unintentional regressions.
2. **Architectural & Rules Verification**: Verify that the code respects SOLID, DRY, KISS, YAGNI, thin controllers, and repository-layer isolation.
3. **Edge Case & Error Handling Audit**: Ensure all input validation, null/undefined checks, and exception boundaries are properly handled.
4. **Empirical Runtime Verification**: Run build checks, unit/E2E tests, or API execution commands to gather concrete proof that the code runs cleanly. Never declare success based on assumptions.

---

## 🔐 Permission & Authorization Contract

Permissions must follow this exact format:

```text
resource:action
```

Allowed actions are:

- `view`
- `create`
- `update`
- `delete`
- `assign`
- `revoke`

The AI Agent **MUST NOT invent broad permission names** such as:

- `resource:manage`
- `resource:admin`
- `resource:*`

Before adding or changing any `@RequirePermissions()` decorator, the AI Agent **MUST verify**:

1. The exact permission string exists in [`prisma/permissions.ts`](file://./prisma/permissions.ts).
2. The permission is seeded by the central-core seed flow.
3. The controller uses the exact same permission name.
4. The endpoint action matches the permission action (`POST` uses `create`, `PATCH` uses `update`, `DELETE` uses `delete`, assignment routes use `assign`/`revoke`).

If the current code uses permission names that do not exist in the seed file, the AI Agent must stop and propose a cleanup plan before changing authorization behavior.

---

## 🧱 Repository Layer Contract

This repository is moving toward strict repository-layer isolation.

For all **new modules** and all **major rewrites**:

- Controllers must call services only.
- Services must call repositories for database access.
- Repositories must own all Prisma queries and raw SQL.
- Services must not inject `PrismaService` or `PrismaCentralCoreService` directly.

Existing modules may still contain direct Prisma usage. Do not refactor those opportunistically unless the user explicitly approves that refactor or the current task requires touching that module deeply.

Required new feature structure:

```text
src/modules/<feature>/
- <feature>.module.ts
- <feature>.controller.ts
- <feature>.service.ts
- dto/
- repositories/
  - <feature>.repository.ts
```

---

## 🗑️ Deletion Contract

Default deletion behavior is **soft delete** for primary entity tables that contain `deletedAt` and `deletedBy`.

DELETE endpoints for primary entities must:

- Set `deletedAt`.
- Set `deletedBy` when authenticated user context is available.
- Exclude soft-deleted records from normal reads.
- Check child dependencies before deletion when business rules require preserving hierarchy integrity.

Hard delete is allowed only when:

- The model is a pure mapping table, such as `UserRole` or `RolePermission`.
- The user explicitly requests hard delete.
- A decision proposal explains why permanent deletion is safe.

---

## 🧭 Dual Database Ownership Contract

Use `central_core_db` for:

- Users, profiles, addresses, sessions, and notifications.
- Roles, permissions, user-role mappings, and role-permission mappings.
- Organizations, organization settings, organization addresses.
- Sites, buildings, floors, flats, residents, and employees.

Use `waste_management` for:

- Waste categories.
- Waste collections.
- Operational waste records.
- Collection photos and collection metrics.
- Waste-operation complaints.
- Reports and dashboards derived from waste operations.

Do not create direct Prisma relations across databases. Cross-database links must be stored as scalar IDs and validated in the service/repository layer.

---

## 📦 DTO, Swagger & API Contract

Every request DTO must:

- Use `class-validator`.
- Use `@ApiProperty` or `@ApiPropertyOptional`.
- Validate IDs as positive integers.
- Validate string length and reject empty/whitespace-only values when the field is required.
- Validate latitude and longitude bounds for coordinate fields.
- Avoid accepting trusted audit/security fields from clients, such as `createdBy`, `updatedBy`, `deletedBy`, privileged `status`, role escalation, or permission escalation fields unless explicitly approved.

Every protected endpoint must:

- Use `@ApiBearerAuth()`.
- Use the correct guard(s).
- Use exact permissions from [`prisma/permissions.ts`](file://./prisma/permissions.ts).

---

## 🧾 Final Response Contract

After implementation, the AI Agent must report:

- Files changed.
- Behavior changed.
- Test/build commands run.
- Whether verification passed.
- Any skipped verification and the reason.
- Remaining risks or follow-up work.

The AI Agent must never claim a feature is complete without empirical verification.

---

## 📚 Documentation Sitemap & Core Rules

Refer to the specialized guides in [`/docs`](file://./docs) for specific standards:

- 🏛️ **[Architecture & Modular Design](file://./docs/architecture.md)**: Feature-first architecture, low coupling, high cohesion, thin controllers, rich services, dedicated repository layer.
- 🧹 **[Coding Standards & Clean Code](file://./docs/coding-standards.md)**: SOLID, DRY, KISS, YAGNI, OOP, composition over inheritance, readable self-documenting code.
- 🧪 **[Testing Strategy & Mandatory Checklist](file://./docs/testing-guide.md)**: Unit, Integration, E2E, edge case matrix, and failure scenario checklist.
- 🌐 **[API Design Guidelines](file://./docs/api-guidelines.md)**: RESTful conventions, DTO validation, standard status codes, error response envelopes.
- 📖 **[Swagger & API Documentation](file://./docs/swagger.md)**: Interactive OpenAPI specifications, request/response models, and controller decorators.
- 🛡️ **[Security Standards](file://./docs/security.md)**: Zero trust client inputs, XSS/SQLi defense, secret management, least privilege.
- ⚡ **[Performance Optimization](file://./docs/performance.md)**: Query optimization, database indexing, caching strategies, event loop non-blocking.
- 🪺 **[NestJS & Dual-Prisma Rules](file://./docs/nestjs-rules.md)**: NestJS 11 best practices, module isolation, dual database client rules (`waste_management` & `central_core_db`).
- 🗄️ **[Database & Migration Rules](file://./docs/database.md)**: Schema evolution, index strategies, transaction safety.
- 🕒 **[Timezone Handling & Localization](file://./docs/timezone-handling.md)**: UTC storage, timezone conversions, and ISO 8601 formatting rules.
- ✅ **[Review & PR Quality Gates](file://./docs/review-checklist.md)**: Pre-commit checklists, quality gates, final review verification.

---

## ⚡ Execution Rules

1. **Step-by-Step Problem Solving**: Never solve a complex task in one giant step. Break it down, test each step, review, and proceed.
2. **Atomic Commits**: Never change multiple unrelated systems in one commit or pull request.
3. **No Dead Code / TODOs**: Never leave commented-out code, temporary debug logs, or unresolved TODOs in production files.
4. **Empirical Verification**: Never claim a bug is fixed or a feature works without executing unit tests or verification commands.

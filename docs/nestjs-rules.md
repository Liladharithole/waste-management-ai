# NestJS & Architecture Best Practices

## 🪺 NestJS Module Structure

Every domain feature must reside inside its own folder under `src/<feature-name>/`:

- `<feature>.module.ts`
- `<feature>.controller.ts`
- `<feature>.service.ts`
- `repositories/` (database queries & data access layer)
- `dto/` (request payload definitions)
- `entities/` (response shapes or Prisma mappings)

---

## 🗄️ Repository & Data Access Rules

To maintain high cohesion and prevent data access logic from leaking into business logic:

1. **Isolation in `repositories/`**:
   - All database operations (Prisma queries, aggregation pipelines, and raw SQL execution) must live inside repository classes located in the feature's `repositories/` directory.
   - Services call Repositories to fetch and persist data; Services **never** invoke `PrismaService` directly.
   - Controllers **never** interact with Repositories directly.

2. **Standard vs. Complex / Raw SQL Queries**:
   - **Standard Operations**: Use standard Prisma ORM methods (`findUnique`, `findMany`, `create`, `update`, `delete`) inside the Repository class.
   - **Complex Operations & Raw SQL**: When a query is complex, involves intricate joins, or requires performance tuning, use **Raw SQL** (`prisma.$queryRaw` / `prisma.$executeRaw`) encapsulated strictly inside the Repository class.

### 3. Existing Direct-Prisma Code vs New Work

Some existing modules may still call `PrismaService` or `PrismaCentralCoreService` directly from services. Treat that as legacy implementation detail, not the preferred pattern.

For all new modules and major rewrites:

- Create a `repositories/` folder.
- Put all Prisma queries inside a repository class.
- Inject repositories into services.
- Do not inject Prisma clients directly into services.
- Do not refactor unrelated legacy modules just to enforce this rule unless the user approves that scope.

Required feature layout:

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

## 🔌 Dual Prisma Database Services

This project handles two distinct databases:

1. **Main Application Database** (`waste_management`):
   - Schema: [`prisma/schema.prisma`](file://./prisma/schema.prisma)
   - Config: [`prisma.config.ts`](file://./prisma.config.ts)
   - Client: Managed by `PrismaService` in `src/prisma/`.
2. **Central Core Database** (`central_core_db`):
   - Schema: [`prisma/schema.core-central.prisma`](file://./prisma/schema.core-central.prisma)
   - Config: [`prisma-central-core.config.ts`](file://./prisma-central-core.config.ts)
   - Client: Managed by `PrismaCentralCoreService` in `src/prisma-central-core/`.

### 3. Database Ownership

Use `central_core_db` for identity and platform hierarchy:

- Users, profiles, addresses, refresh tokens, notifications.
- Roles, permissions, user-role mappings, role-permission mappings.
- Organizations, settings, organization addresses.
- Sites, buildings, floors, units, residents, employees.

Use `waste_management` for waste-operation data:

- Waste categories.
- Waste collections.
- Collection photos and metrics.
- Operational complaints.
- Reports and dashboards derived from waste operations.

Do not create Prisma relations across databases. Store cross-database references as scalar IDs and validate them in application code.

---

## 🛠️ Global Filters & Interceptors

- **Global Exceptions Filter**: Handled by [`AllExceptionsFilter`](file://./src/common/filters/all-exceptions.filter.ts).
- **Shutdown Hooks**: `app.enableShutdownHooks()` must remain enabled in [`main.ts`](file://./src/main.ts) to gracefully disconnect Prisma clients on SIGTERM/SIGINT.

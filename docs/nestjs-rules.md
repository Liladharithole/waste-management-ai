# NestJS & Architecture Best Practices

## 🪺 NestJS Module Structure

Every domain feature must reside inside its own folder under `src/<feature-name>/`:
* `<feature>.module.ts`
* `<feature>.controller.ts`
* `<feature>.service.ts`
* `repositories/` (database queries & data access layer)
* `dto/` (request payload definitions)
* `entities/` (response shapes or Prisma mappings)

---

## 🗄️ Repository & Data Access Rules

To maintain high cohesion and prevent data access logic from leaking into business logic:

1. **Isolation in `repositories/`**:
   * All database operations (Prisma queries, aggregation pipelines, and raw SQL execution) must live inside repository classes located in the feature's `repositories/` directory.
   * Services call Repositories to fetch and persist data; Services **never** invoke `PrismaService` directly.
   * Controllers **never** interact with Repositories directly.

2. **Standard vs. Complex / Raw SQL Queries**:
   * **Standard Operations**: Use standard Prisma ORM methods (`findUnique`, `findMany`, `create`, `update`, `delete`) inside the Repository class.
   * **Complex Operations & Raw SQL**: When a query is complex, involves intricate joins, or requires performance tuning, use **Raw SQL** (`prisma.$queryRaw` / `prisma.$executeRaw`) encapsulated strictly inside the Repository class.

---

## 🔌 Dual Prisma Database Services

This project handles two distinct databases:
1. **Main Application Database** (`waste_management`):
   * Schema: [`prisma/schema.prisma`](file://./prisma/schema.prisma)
   * Config: [`prisma.config.ts`](file://./prisma.config.ts)
   * Client: Managed by `PrismaService` in `src/prisma/`.
2. **Central Core Database** (`central_core_db`):
   * Schema: [`prisma/schema.core-central.prisma`](file://./prisma/schema.core-central.prisma)
   * Config: [`prisma-central-core.config.ts`](file://./prisma-central-core.config.ts)
   * Client: Managed by `PrismaCentralCoreService` in `src/prisma-central-core/`.

---

## 🛠️ Global Filters & Interceptors

* **Global Exceptions Filter**: Handled by [`AllExceptionsFilter`](file://./src/common/filters/all-exceptions.filter.ts).
* **Shutdown Hooks**: `app.enableShutdownHooks()` must remain enabled in [`main.ts`](file://./src/main.ts) to gracefully disconnect Prisma clients on SIGTERM/SIGINT.

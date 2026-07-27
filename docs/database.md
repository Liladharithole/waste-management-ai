# Database & Migration Rules

## 🗄️ Prisma 7 & Dual Database Rules

### 1. Dual Schema Isolation
* Main Database: `waste_management` (Schema: [`prisma/schema.prisma`](file://./prisma/schema.prisma))
* Central Core Database: `central_core_db` (Schema: [`prisma/schema.core-central.prisma`](file://./prisma/schema.core-central.prisma))
* Do not mix models between `schema.prisma` and `schema.core-central.prisma`.
* `prisma/schema.prisma` handles application-level entities (e.g. user records, waste logs).
* `prisma/schema.core-central.prisma` handles central management, tenant indexes, or core metrics.

### 2. Migration Execution
Always use the dedicated npm scripts for database schema changes:
```bash
# Apply migrations for the main database (waste_management)
npm run db:migrate

# Apply migrations for the central core database (central_core_db)
npm run db:migrate:central-core
```

### 3. Database Design Rules
* **Primary Keys**: Use `@id @default(uuid())` or `@id @default(autoincrement())` consistently.
* **Timestamps**: Every table must include `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.
* **Foreign Key Indexes**: Always place `@index` on foreign key fields to optimize join queries.
* **Transactions**: Wrap multi-step database writes in `prisma.$transaction()` to guarantee atomicity.

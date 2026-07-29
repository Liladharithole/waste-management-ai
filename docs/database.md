# Database & Migration Rules

This document defines the core database schema standards, transaction patterns, and cross-database query rules for the application. All developers and AI agents **MUST check this file** before creating or modifying any database tables.

---

## 🗄️ Prisma 7 & Dual Database Rules

### 1. Dual Schema Isolation

- **Main Database**: `waste_management` (Schema: [`prisma/schema.prisma`](file://./prisma/schema.prisma))
  - Handles local application-level transactions (e.g., waste records, pickup routes).
- **Central Core Database**: `central_core_db` (Schema: [`prisma/schema.core-central.prisma`](file://./prisma/schema.core-central.prisma))
  - Handles central system parameters, tenant registry, and core user records.

Do **NOT** mix models or create direct Prisma relations across these schemas.

---

## ⚡ ACID & DBMS Design Principles

To ensure transaction stability, reliability, and performance:

1. **Atomicity**: Wrap all multi-step database writes (e.g., creating a user and their profile, or recording a transaction and updating a balance) in `prisma.$transaction()` to guarantee all-or-nothing execution.
2. **Consistency (Referential Integrity)**:
   - Define clear foreign key actions (`onDelete: Cascade` or `onDelete: Restrict`) for all table relationships.
   - Do not delete parent records if orphans would violate system logic.
3. **Isolation**: Optimize querying patterns to avoid read locks. Use indices on heavily filtered or joined columns.
4. **Durability**: Rely on transaction logs. Ensure connections are safely closed on system shutdown hooks.

---

## 🔑 Table Column Standards & Naming Conventions

Every table created in the system **MUST** follow these field conventions:

### 1. Double Identifier Columns

Every table must use an internal integer ID for fast relational joins and a secondary unique UUID for public API visibility. The `uuid` column **MUST** be placed immediately after the `id` column:

```prisma
model MyTable {
  id    Int    @id @default(autoincrement()) // Internal primary key
  uuid  String @unique @default(uuid())      // External API identifier
}
```

### 2. Mandatory Audit & Log Columns

To track record lifecycles, every table **MUST** contain:

- `createdAt DateTime @default(now())` - Set automatically in UTC when the row is created.
- `createdBy String?` - The UUID or username of the actor who created the row.
- `updatedAt DateTime @updatedAt` - Set automatically in UTC on any modification.
- `updatedBy String?` - The UUID or username of the actor who last updated the row.

### 3. Indexes on Foreign Keys

Prisma does not index foreign keys by default in relational databases. Always place an `@@index([foreignKeyField])` on relation fields to optimize database joins:

```prisma
@@index([userId])
```

---

## 🌐 Cross-Database Join Policy

When data from `waste_management` needs to be linked with data from `central_core_db`, follow **Option 1: Application-Level Joins**:

1. **Do NOT write Cross-Database Raw SQL Queries** (e.g., joining databases using `central_core_db.User` in the main database client) unless specifically approved by architecture leads.
2. **Query Sequentially**:
   - First, retrieve records from the source database (e.g., a waste log).
   - Second, query the central core database using the referenced ID to retrieve the user's profile/metadata.
   - Finally, merge the results in the NestJS service layer before returning the response.

_Rationale_: This prevents tight coupling of schemas, allows databases to be moved to different physical hosts in the future, and ensures microservice readiness.

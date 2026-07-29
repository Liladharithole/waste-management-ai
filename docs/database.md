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

## 🔑 Table & Column Standards (Naming Conventions)

Every table and column created in the system **MUST** follow these naming and mapping conventions:

### 1. Model & Table Naming

- **In Prisma (Schema)**: Use **PascalCase (singular)**. (e.g., `model UserAddress`, `model WasteCollection`).
- **In Database (SQL)**: Must map to **plural snake_case** using the `@@map` decorator. (e.g. `@@map("user_addresses")`, `@@map("waste_collections")`).

```prisma
model UserAddress {
  id Int @id

  @@map("user_addresses")
}
```

### 2. Column & Field Naming

- **In Prisma (Schema)**: Use **camelCase**. (e.g., `firstName`, `ipAddress`, `avatarUrl`).
- **In Database (SQL)**: Must map to **snake_case** using the `@map` decorator. (e.g., `@map("first_name")`, `@map("ip_address")`, `@map("avatar_url")`).

```prisma
model User {
  firstName String @map("first_name")
}
```

### 3. Double Identifier Columns

Every table must use an internal integer ID for fast relational joins and a secondary unique UUID for public API visibility. The `uuid` column **MUST** be placed physically immediately after the `id` column:

```prisma
model User {
  id   Int    @id @default(autoincrement())
  uuid String @unique @default(uuid()) @map("uuid")
}
```

### 4. Mandatory Audit & Log Columns

To track record lifecycles and support soft deletions, every primary entity table **MUST** contain:

- `createdAt DateTime @default(now()) @map("created_at")`
- `createdBy String? @map("created_by")`
- `updatedAt DateTime @updatedAt @map("updated_at")`
- `updatedBy String? @map("updated_by")`
- `deletedAt DateTime? @map("deleted_at")`
- `deletedBy String? @map("deleted_by")`

### 5. Indexes on Foreign Keys

Prisma does not index foreign keys by default in relational databases. Always place an `@@index([foreignKeyField])` on relation fields (mapped to snake_case) to optimize database joins:

```prisma
@@index([user_id]) // Mapped column name is index key
```

### 6. Use Enums for Fixed Options

Always use database-level Enums (Prisma `enum`) for any column that has a fixed, predefined list of multiple options (e.g., `status`, `role`, `type`). This enforces type safety in your TypeScript code and guarantees database integrity.

---

## 🌐 Cross-Database Join Policy

When data from `waste_management` needs to be linked with data from `central_core_db`, follow **Option 1: Application-Level Joins**:

1. **Do NOT write Cross-Database Raw SQL Queries** (e.g., joining databases using `central_core_db.User` in the main database client) unless specifically approved by architecture leads.
2. **Query Sequentially**:
   - First, retrieve records from the source database (e.g., a waste log).
   - Second, query the central core database using the referenced ID to retrieve the user's profile/metadata.
   - Finally, merge the results in the NestJS service layer before returning the response.

_Rationale_: This prevents tight coupling of schemas, allows databases to be moved to different physical hosts in the future, and ensures microservice readiness.

---

## 🗑️ Soft-Delete Policy

To prevent permanent data loss, maintain historical audit trails, and ensure relational integrity, the application enforces a **Soft-Delete Pattern** for all primary entity tables (e.g. `User`, `Organization`, `Society`, `WasteCollection`).

### 1. Mandatory Columns

Every primary entity table **MUST** include the following columns:

- `deletedAt DateTime?` - Stores `NULL` if the record is active, and the deletion date-time if deleted.
- `deletedBy String?` - The UUID or username of the actor who deleted the record.

### 2. Execution in Code

- **Never use hard-delete queries** (e.g., `prisma.user.delete()`) for entity records.
- **Perform updates instead**: Set `deletedAt` to the current timestamp and populate `deletedBy` in the update arguments:
  ```typescript
  prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy: activeUserUuid,
    },
  });
  ```

### 3. Query Filtering

- Always filter out soft-deleted records when performing queries:
  ```typescript
  prisma.user.findMany({
    where: { deletedAt: null },
  });
  ```

### 4. Cascade Handling in Application

- Database-level cascade rules (`onDelete: Cascade`) will **not** trigger on soft deletes since soft deleting is an `UPDATE` operation, not a physical `DELETE`.
- Developers must handle cascades in the application layer using one of the two strategies outlined below depending on the depth of the hierarchy.

### 5. Cascading Soft Deletes in Deep Hierarchies

For deep hierarchies (e.g., `Organization` ➡️ `Society` ➡️ `Building` ➡️ `Flat`), choose the appropriate strategy:

#### Strategy A: Inherited Soft Delete / Lazy Checking (Recommended)

Instead of updating every nested row, **only soft-delete the top-level parent record** (e.g., the `Organization`). When querying child entities, filter using Prisma's relational check to ensure all parent entities are also active:

```typescript
// Query active flats only if their parent building, society, and organization are active
prisma.flat.findMany({
  where: {
    deletedAt: null,
    building: {
      deletedAt: null,
      society: {
        deletedAt: null,
        organization: {
          deletedAt: null,
        },
      },
    },
  },
});
```

- **Pros**: O(1) delete execution (single update query), instant rollback/restore of the entire hierarchy by updating just the top-level parent back to `NULL`.

#### Strategy B: Recursive Service-Level updates (Atomic Transaction)

Use this when you specifically want child records to reflect deletion status independently (e.g., deleting a specific `Society` and marking all its `Flats` as deleted):

```typescript
await prisma.$transaction(async (tx) => {
  const now = new Date();

  // 1. Soft-delete parent Society
  await tx.society.update({
    where: { id: societyId },
    data: { deletedAt: now, deletedBy: adminUuid },
  });

  // 2. Query child Building IDs
  const buildings = await tx.building.findMany({
    where: { societyId, deletedAt: null },
    select: { id: true },
  });
  const buildingIds = buildings.map((b) => b.id);

  // 3. Soft-delete Buildings
  await tx.building.updateMany({
    where: { id: { in: buildingIds } },
    data: { deletedAt: now, deletedBy: adminUuid },
  });

  // 4. Soft-delete Flats under those Buildings
  await tx.flat.updateMany({
    where: { buildingId: { in: buildingIds } },
    data: { deletedAt: now, deletedBy: adminUuid },
  });
});
```

- **Pros**: Child records are physically marked as deleted.
- **Cons**: Slower execution, requires transaction blocks and multiple database roundtrips.

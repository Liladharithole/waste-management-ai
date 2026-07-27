# Architecture & System Design Rules

## 🏛️ Core Architectural Principles

* **Feature-First Architecture**: Group code by business domain and feature module rather than technical layer alone.
* **High Cohesion & Low Coupling**: Modules should be self-contained with minimal external dependencies.
* **Clear Separation of Concerns**:
  * **Controllers**: Remain strictly thin. Responsible only for route handling, request validation, and returning HTTP responses.
  * **Services**: Contain all domain and business logic. Never put business logic in UI, controllers, or database queries.
  * **Repositories (`repositories/`)**: Encapsulate all database operations. Standard queries use Prisma ORM methods, while complex or performance-critical queries use Raw SQL (`$queryRaw`). Services call Repositories; Services never call Prisma directly.
  * **Shared Modules**: Belong in `src/common` or `src/shared` for utilities, global filters, and cross-cutting interceptors.

## 🔄 Layer Boundaries & Request Flow

```
[ Client Request ]
       │
       ▼
[ Controller ] ──► (Validates DTO via ValidationPipe)
       │
       ▼
[ Service Layer ] ──► (Executes Business Logic & Domain Rules)
       │
       ▼
[ Repository Layer ] ──► (Prisma ORM Methods OR Raw SQL Queries for complex logic)
       │
       ▼
[ MariaDB / MySQL Databases ] (waste_management & central_core_db)
```

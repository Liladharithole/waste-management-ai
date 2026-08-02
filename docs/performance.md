# Performance & Scalability Rules

## ⚡ Query & Database Performance

- **Avoid N+1 Queries**: Use Prisma's `include` or `select` joins efficiently to fetch related records in single queries instead of executing queries in loops.
- **Paginate Large Datasets**: Always enforce limit and offset pagination (`take` and `skip` in Prisma) on list endpoints.
- **Index Frequently Queried Columns**: Ensure foreign keys, search filters, and sorting columns have database indexes defined in `schema.prisma`.

---

## 🚀 Node.js Event Loop & Caching

- **Non-Blocking Operations**: Avoid sync file system operations (`fs.readFileSync`) or CPU-intensive tasks on the main Node.js thread.
- **Caching Heavy Computation**: Cache expensive queries or static data using Redis or in-memory caches.
- **Stream Large File Processing**: Stream responses and file parsing instead of buffering entire payloads into memory.
- **Memory Leak Prevention**: Always clean up event listeners, timers, and database connections on app shutdown (`enableShutdownHooks()`).

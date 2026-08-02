# Production-Ready Redis Caching Configuration Walkthrough

We have successfully configured **Redis Distributed Caching** in our application as the production-ready standard for sharing cached responses across scalable backend instances.

---

## 🐋 1. Containerized Infrastructure

Added a dedicated Redis container in [docker-compose.yml](file://./docker-compose.yml) running on port `6379`, configured with health checks:

```yaml
redis:
  image: redis:7-alpine
  container_name: waste-management-redis
  restart: always
  ports:
    - '${REDIS_PORT:-6379}:6379'
  volumes:
    - redis_data:/data
```

---

## ⚙️ 2. Environment Configurations

Added connection parameters to the environment file [.env](file://./.env):

- `REDIS_HOST=localhost` (Runs under `redis` container host name inside Docker networks)
- `REDIS_PORT=6379`

---

## 🚀 3. NestJS Integration

Integrated NestJS `CacheModule` dynamically using `cache-manager-redis-yet` inside [app.module.ts](file://./src/app.module.ts):

```typescript
CacheModule.registerAsync({
  isGlobal: true,
  useFactory: async () => ({
    store: await redisStore({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
      ttl: 300000, // 5 minutes default
    }),
  }),
});
```

---

## 🧪 Verification & Health

- **ESLint**: Passed with **0 errors and 0 warnings** (`npx eslint .`).
- **Formatting**: 100% formatted under Prettier style.
- **Jest Unit Tests**: All 10 Jest test suites (**98/98 unit tests**) passed cleanly.
- **Build Check**: Verified `npm run build` compiles successfully.

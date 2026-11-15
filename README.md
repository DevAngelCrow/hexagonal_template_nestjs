# Hexagonal Template NestJS

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

> **Plantilla backend empresarial con NestJS 12, TypeScript 6, Prisma 7 (`@prisma/adapter-pg`), Arquitectura Hexagonal Estricta, CQRS, Redis/BullMQ, Vitest y oxlint.**

---

## 🏛️ Arquitectura y Principios de Diseño

Esta plantilla implementa una **Arquitectura Hexagonal (Puertos y Adaptadores)** estricta y desacoplada, respaldada por pruebas automatizadas de fronteras de capas ([`test/architecture.spec.ts`](test/architecture.spec.ts)) y reglas estáticas ([`.oxlintrc.json`](.oxlintrc.json)):

```
                        ┌──────────────────────────────────────────────────────────┐
                        │                     INFRASTRUCTURE                       │
                        │  Controllers (/api/v1), PrismaService, Guards, Middlewares│
                        │  Impl* Repositories, Redis/Keyv, BullMQ Workers & Board  │
                        └────────────────────────────┬─────────────────────────────┘
                                                     │ implements / dispatches
                                                     ▼
                        ┌──────────────────────────────────────────────────────────┐
                        │                      APPLICATION                         │
                        │  CQRS Commands/Queries (@nestjs/cqrs), Services puros,   │
                        │  DTOs, Read Ports (*ReadRepository / *QueriesRepository) │
                        └────────────────────────────┬─────────────────────────────┘
                                                     │ orchestrates / uses
                                                     ▼
                        ┌──────────────────────────────────────────────────────────┐
                        │                         DOMAIN                           │
                        │  Aggregates (AggregateRoot), Entities, Value Objects,    │
                        │  Domain Events, Abstract Repositories & Ports (Zero DI)  │
                        └──────────────────────────────────────────────────────────┘
```

### Reglas de Dependencia y Calidad
- **Dominio (`domain/`)**: TypeScript puro. Solo importa rutas relativas, `@/shared/domain/`, `@/modules/*/domain/` o `node:crypto`/`crypto`. Nunca importa `@nestjs/*`, `@prisma/*`, `application/` ni `infrastructure/`.
- **Aplicación (`application/`)**: Orquesta casos de uso vía `@nestjs/cqrs` (`@CommandHandler`, `@QueryHandler`) y Application Services puros (instanciados por [`registerService`](src/shared/infrastructure/factories/register-service.factory.ts) sin `@Injectable()`). Prohíbe `@prisma/`, `generated/prisma`, `infrastructure/` y `xstate`.
- **Infraestructura (`infrastructure/`)**: Implementa puertos y clases abstractas usando Prisma (`this.prisma.client`), Redis, BullMQ, Resend, AWS SDK S3, Multer y Passport JWT. Prohíbe invocar `$transaction(` directamente dentro de `*repository*` (las transacciones se declaran con `@Transactional()` en controladores).
- **Cero aserciones de tipo `as`**: Tanto `oxlint` (`typescript/consistent-type-assertions: never`) como `test/architecture.spec.ts` prohíben `as <Tipo>` en código productivo (solo `as const` está permitido).

Para normativa y tutoriales detallados consulta:
- [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md) — Convenciones arquitectónicas por capa y pipeline transaccional.
- [GUIA_CREACION_MODULO.md](GUIA_CREACION_MODULO.md) — Guía paso a paso para crear nuevos módulos.
- [AGENTS.md](AGENTS.md) — Reglas operativas de arquitectura y calidad.

---

## 🚀 Módulos y Runtimes del Sistema

La aplicación cuenta con **dos procesos de entrada** independientes compartiendo `AppModule` e `IamModule`:
- **API HTTP ([`src/main.ts`](src/main.ts))**: Expone `/api/v1/*`, documentación Swagger/Scalar, Bull Board, Prometheus y Health Checks.
- **Worker BullMQ ([`src/worker.ts`](src/worker.ts) + [`src/worker.module.ts`](src/worker.module.ts))**: Contexto NestJS *headless* sin servidor HTTP que ejecuta los procesadores de correo (`EmailProcessor`, `PasswordResetEmailProcessor`, `EmailChangeProcessor`).

### Bounded Contexts
1. **`iam` (`src/modules/iam/`) — Identity & Access Management**:
   - **Autenticación y Sesiones (`AuthController`)**: Registro con verificación por correo, Login con Turnstile opcional y bloqueo tras intentos fallidos (`LoginThrottleGuard`, `HTTP 423`), Cookie `HttpOnly` `refresh_token` (`SameSite=Strict`, `Path=/api/v1/auth`) con rotación de sesiones en `mnt_session_refresh_token` (SHA-256 + `jti`, máximo 5 sesiones, detección de reuso), reseteo de contraseña con historial (`mnt_password_history`) y flujo separado de cambio de correo con challenge en Redis.
   - **Perfiles, IDOR y RBAC**: Gestión de usuarios, personas, direcciones, documentos y tipos de documento protegida con `JwtPassportAuthGuard`, `PermissionsGuard`, `CheckAuthenticatedUserGuard` y `OwnsResourceGuard` (`@OwnsResource`), además de Roles, Permisos, Categorías, Rutas y Menú dinámico cacheado en Redis (`user:<id>:menu` + `menu:routes:version`).
2. **`catalogs` (`src/modules/catalogs/`) — Catálogos Maestros**:
   - Países (con ruta pública `@Public()` y caché Redis `catalogs:countries:all` con bypass dinámico en filtros/paginación), Divisiones Geográficas jerárquicas (incluye `/public`, `/cursor` y `/lineage`), Tipos de División, Estados Globales, Categorías de Estado, Estados Civiles y Géneros.
3. **`storage` (`src/modules/storage/`) — Almacenamiento Multimedia**:
   - Proveedores configurables (`LOCAL` en `uploads/` con confinamiento anti *path-traversal* vía `resolveConfinedStoragePath`, o `S3` para AWS S3 / Cloudflare R2 / MinIO vía `@aws-sdk/client-s3`). Validación de límites MIME y firmas binarias (*magic bytes* JPEG/PNG/GIF/WEBP/PDF).
4. **`audit` (`src/modules/audit/`) — Trazabilidad**:
   - Decorador `@Auditable()` e interceptor global `AuditableInterceptor` (deferido post-commit cuando existe `@Transactional()` o escritura inmediata ante fallos vía `prisma.rootClient`), más endpoint de consulta en `/api/v1/audit/audit/logs`.
5. **`shared` (`src/shared/`) — Infraestructura Transversal**:
   - `PrismaModule` (`PrismaService.client` sobre `@prisma/adapter-pg` y `pg.Pool`), `TransactionContextService` (`AsyncLocalStorage`), `TransactionAwareEventPublisher` (`afterCommitHooks`), `RedisCacheModule` (`CatalogCacheService` fail-open), `QueuesModule` (BullMQ + Bull Board), `TurnstileModule`, `SequenceGeneratorService`, `StateMachineModule` (XState 5), `HealthModule`, `RequestIdMiddleware`, `IdempotencyMiddleware` (`POST`/`PUT` con `Idempotency-Key` UUID) y `BullBoardAuthMiddleware`.

---

## 🛠️ Stack Tecnológico

| Herramienta | Detalle Real |
|---|---|
| **Framework HTTP / CQRS** | NestJS 12 (`^12.0.1`), `@nestjs/cqrs` (`^12.1.0`), URI Versioning (`v1` bajo `/api`) |
| **Lenguaje** | TypeScript 6 (`^6.0.2`) con configuración estricta y alias `@/*` |
| **ORM y Base de Datos** | Prisma 7 (`^7.10.1`) + PostgreSQL 16 (`@prisma/adapter-pg`, `pg.Pool`) |
| **Colas y Mail** | BullMQ (`^6.3.16`) + Bull Board en `/admin/queues` + Resend (`^6.34.1`) |
| **Cache, Throttle y Tokens** | Redis 7 + Keyv (`@keyv/redis`), `@nestjs/throttler` (limitadores `global` y `login`), `passport-jwt` |
| **Test Runner y Linter** | Vitest 4 (`^4.1.2`) + oxlint (`^1.58.0`) type-aware |
| **Observabilidad y Docs** | `nestjs-pino` (con redacción de credenciales), `prom-client` en `/metrics`, Terminus en `/api/v1/health`, Swagger (`/api/docs`) y Scalar (`/docs`) |

---

## 📦 Instalación y Puesta en Marcha

### 1. Instalar Dependencias y Configurar Entorno
```bash
npm install
cp .env.example .env
```

> [!IMPORTANT]
> La validación de arranque ([`env.validation.ts`](src/shared/infrastructure/config/env.validation.ts) y [`AppService`](src/app.service.ts)) exige claves mínimas reales en `.env`:
> - `JWT_SECRET` y `JWT_REFRESH_SECRET` de al menos **32 caracteres** (y distintos entre sí fuera de `development`).
> - `REDIS_PASSWORD` de al menos **12 caracteres**.
> - En `production`: `DATABASE_DIRECT_URL`, `METRICS_TOKEN`, y `SEED_ADMIN_PASSWORD` al ejecutar seeds.

### 2. Levantar Servicios Base (Docker Compose)
```bash
docker compose up -d
```

### 3. Migraciones, Cliente Prisma y Datos Semilla
```bash
# Opción rápida todo-en-uno para desarrollo
npm run dev:setup

# O paso a paso
npx prisma migrate dev
npx prisma generate
npm run prisma:seed
```

Para despliegue en producción:
```bash
npm run production:setup
# Opcional solo si se requiere inicializar catálogos/admin en BD vacía:
SEED_ADMIN_PASSWORD="<clave-fuerte>" npm run prisma:seed:prod
```

---

## 💻 Comandos de Ejecución

```bash
# Desarrollo con recarga automática (API HTTP)
npm run start:dev

# Worker de segundo plano en modo watch (Procesador BullMQ de correos)
npm run start:worker

# Compilación de producción (incluye dist/prisma/seeds)
npm run build

# Ejecución en producción (dos procesos separados)
npm run start:prod
npm run start:worker:prod
```

---

## 🧪 Pruebas y Calidad de Código

```bash
# Verificación completa recomendada (oxlint --max-warnings=0 + typecheck)
npm run check

# Solo linter type-aware (oxlint)
npm run lint
npm run lint:ci

# Solo chequeo de tipos (TypeScript)
npm run typecheck

# Formateo con Prettier
npm run format

# Pruebas unitarias y de arquitectura (Vitest)
npm test

# Pruebas End-to-End (Vitest config E2E)
npm run test:e2e

# Cobertura de código
npm run test:cov
```

---

## 🛡️ Endpoints de Sistema, Colas y Documentación

*(Salvo `/api/v1/health*`, estas rutas operan fuera del prefijo `/api` o con autenticación dedicada).*

- **Scalar API Reference** *(cuando `ENABLE_API_DOCS=true`)*: `http://localhost:3000/docs`
- **Swagger UI & OpenAPI JSON** *(cuando `ENABLE_API_DOCS=true`)*: `http://localhost:3000/api/docs` y `http://localhost:3000/api/docs-json`
- **Login / Logout para Docs Protegidos**: `http://localhost:3000/api/docs/login` y `http://localhost:3000/api/docs/logout` (requiere usuario con permiso `ver-documentacion-api` para emitir cookie HttpOnly `docs_access`)
- **Bull Board Dashboard**: `http://localhost:3000/admin/queues` (protegido por `BullBoardAuthMiddleware`: Bearer JWT o cookie `queues_access` + permiso `listar-administracion`)
- **Health Checks (`@SkipAuth`)**:
  - `http://localhost:3000/api/v1/health`
  - `http://localhost:3000/api/v1/health/live`
  - `http://localhost:3000/api/v1/health/ready`
- **Prometheus Metrics**: `http://localhost:3000/metrics` (`VERSION_NEUTRAL`, protegido por `Authorization: Bearer <METRICS_TOKEN>`)

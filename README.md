# Hexagonal Template NestJS

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

> **Plantilla backend empresarial con NestJS 12, TypeScript 6, Arquitectura Hexagonal Estricta, Servicios de Aplicación Pragmáticos, Vitest, oxlint y Eventos de Dominio Transaccionales.**

---

## 🏛️ Arquitectura y Principios de Diseño

Esta plantilla implementa una **Arquitectura Hexagonal (Puertos y Adaptadores)** estricta y desacoplada, respaldada por pruebas automatizadas de fronteras de capas (`test/architecture.spec.ts`):

```
                        ┌────────────────────────────────────────────────────────┐
                        │                   INFRASTRUCTURE                       │
                        │  Controllers, Prisma Repositories, Adapters, Guards,   │
                        │  Redis, BullMQ Workers, Bull Board, Pino Logger        │
                        └──────────────────────────┬─────────────────────────────┘
                                                   │ implements / calls
                                                   ▼
                        ┌────────────────────────────────────────────────────────┐
                        │                    APPLICATION                         │
                        │  Application Services, Commands, Queries, DTOs, Ports  │
                        └──────────────────────────┬─────────────────────────────┘
                                                   │ orchestrates / calls
                                                   ▼
                        ┌────────────────────────────────────────────────────────┐
                        │                       DOMAIN                           │
                        │  Entities, AggregateRoot, Domain Events, Enums, VOs    │
                        │  (Zero framework imports: no @nestjs, no prisma, no db)│
                        └────────────────────────────────────────────────────────┘
```

### 1. Reglas de Dependencia
- **Dominio (`domain`)**: Puro TypeScript. Nunca importa `@nestjs/*`, `@prisma/*`, frameworks o librerías de infraestructura.
- **Aplicación (`application`)**: Orquesta casos de uso mediante Application Services (o Command/Query handlers donde convenga). Define puertos puros (`*Port`, `*Repository`) sin acoplarse a tecnologías de persistencia ni HTTP.
- **Infraestructura (`infrastructure`)**: Implementa puertos con tecnologías concretas (Prisma, PostgreSQL, Redis, BullMQ, Resend, JWT, etc.).

---

## 🚀 Módulos del Sistema

1. **`iam` (Identity & Access Management - Unificado)**:
   - Consolida Autenticación, Gestión de Usuarios, Perfiles de Persona y Control de Acceso (Roles, Permisos, Menús, Rutas) en un único bounded context sin llamadas cross-module acopladas.
   - Emite eventos de dominio para efectos secundarios desacoplados.
2. **`catalogs`**:
   - Catálogos generales (Países, Divisiones Geográficas, Estados de Categoría, Género, Estados Civiles).
   - Cache distribuido en Redis con fallback transparente a base de datos.
3. **`storage`**:
   - Abstracción de almacenamiento de archivos con backend dual: `LOCAL` (sistema de archivos) y `S3` (AWS S3, MinIO, Cloudflare R2).
4. **`audit`**:
   - Registro de auditoría independiente de operaciones críticas y autenticación (`AuditLogService` con suscriptor asíncrono para desacoplar transacciones de negocio).
5. **`shared`**:
   - Fundaciones transversales: `TransactionContextService` (AsyncLocalStorage), `TransactionAwareEventPublisher`, adaptadores de fecha (`DayjsDateAdapter`), métricas (`PrometheusMetricsAdapter`), y middleware de idempotencia / correlación (`x-request-id`).

---

## ⚡ Eventos de Dominio y Publicación Transaccional

Los eventos de dominio heredan de `DomainEvent`, se acumulan en entidades que extienden `AggregateRoot`:

```typescript
// 1. La entidad acumula el evento
user.record(new UserRegisteredDomainEvent(user.id, user.email, user.userName));

// 2. El handler extrae y publica los eventos acumulados
const events = user.pullDomainEvents();
await this.eventPublisher.publish(events);
```

- **`TransactionAwareEventPublisher`**: Detecta automáticamente si existe una transacción activa en el contexto (`AsyncLocalStorage`). Si hay transacción, retiene los eventos y los despacha mediante **`afterCommitHooks`** únicamente tras el commit exitoso de la base de datos.
- **Suscriptores Reales (`@EventsHandler`)**:
  - `SendEmailVerificationSubscriber`: Encola jobs en BullMQ tras registro de usuario.
  - `SendPasswordResetSubscriber`: Encola jobs para reseteo de credenciales.
  - `InvalidateRoleCacheSubscriber`: Invalida claves de permisos de roles en Redis.
  - `AuditIamSubscriber`: Enlaza eventos de negocio con auditoría sin acoplamiento sincrónico.

---

## 🛠️ Stack Tecnológico

| Herramienta | Versión / Detalle |
|---|---|
| **Framework** | [NestJS 12](https://nestjs.com/) |
| **Lenguaje** | [TypeScript 6](https://www.typescriptlang.org/) |
| **ORM** | [Prisma 7](https://www.prisma.io/) con `@prisma/adapter-pg` y pool pg |
| **Test Runner** | [Vitest 4](https://vitest.dev/) (Unit, Architecture & E2E) |
| **Linter** | [oxlint](https://oxc.rs/) (Type-aware ultra-rápido) |
| **Colas de Tareas** | [BullMQ](https://docs.bullmq.io/) + Bull Board Dashboard en `/queues` |
| **Cache Distribuido** | [Redis](https://redis.io/) con [Keyv](https://keyv.org/) |
| **Logging** | [Pino](https://getpino.io/) con redacción de credenciales en producción |
| **Métricas** | Prometheus en `/metrics` + Health Checks en `/health` |

---

## 📦 Instalación y Configuración

### 1. Clonar e Instalar Dependencias
```bash
npm install
```

### 2. Variables de Entorno
Copia el archivo de ejemplo y ajusta las credenciales:
```bash
cp .env.example .env
```

### 3. Levantar Servicios de Infraestructura (Docker)
```bash
docker compose up -d
```

### 4. Generar Cliente Prisma y Migraciones
```bash
npx prisma generate
npx prisma migrate dev
```

---

## 💻 Comandos de Ejecución

```bash
# Desarrollo con recarga automática (API)
npm run start:dev

# Worker de segundo plano en modo watch (Procesador BullMQ)
npm run start:worker

# Compilación de producción
npm run build

# Ejecución en producción
npm run start:prod
npm run start:worker:prod
```

---

## 🧪 Pruebas y Calidad de Código

```bash
# Pruebas unitarias y de arquitectura (Vitest)
npm test

# Pruebas End-to-End (E2E)
npm run test:e2e

# Cobertura de código
npm run test:cov

# Linter type-aware (oxlint)
npm run lint

# Formateo de código
npm run format
```

---

## 🛡️ Endpoints y Documentación Interactiva

- **Scalar API Reference**: `http://localhost:3000/reference`
- **Swagger UI**: `http://localhost:3000/docs`
- **Bull Board Dashboard**: `http://localhost:3000/queues`
- **Health Checks**: `http://localhost:3000/health`
- **Prometheus Metrics**: `http://localhost:3000/metrics`

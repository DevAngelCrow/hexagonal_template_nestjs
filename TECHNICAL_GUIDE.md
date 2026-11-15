# Guía Técnica: Arquitectura Hexagonal en NestJS 12

> **Documento normativo de arquitectura para `hexagonal_template_nestjs`. Define las fronteras entre capas, clases abstractas como puertos DI, servicios puros vs handlers CQRS, publicación transaccional y pruebas automáticas.**

---

## 1. Las Tres Capas y sus Responsabilidades

El cumplimiento de estas fronteras se verifica automáticamente en [`test/architecture.spec.ts`](test/architecture.spec.ts) y [`.oxlintrc.json`](.oxlintrc.json).

### 1.1 Capa de Dominio (`src/**/domain/`)
- **Regla de oro**: Cero dependencias de infraestructura, `@prisma/*`, `@nestjs/*` o `xstate`. Solo TypeScript puro (y `node:crypto`/`crypto` si es indispensable).
- **Contenido**:
  - **Agregados (`aggregates/`)**: Modelos raíz que encapsulan estado, invariantes y eventos de dominio. Extienden [`AggregateRoot`](src/shared/domain/aggregate-root.ts).
  - **Entidades (`entities/`)**: Objetos con identidad propios del dominio gobernados mediante Value Objects.
  - **Value Objects (`value-objects/`)**: Clases inmutables autovalidadas mediante [`Validator.of(...)`](src/shared/domain/validators/validator-value-object.ts) y [`InvalidValueObjectException`](src/shared/domain/exceptions/invalid-value-object.exception.ts).
  - **Eventos de Dominio (`events/`)**: Clases que extienden [`DomainEvent`](src/shared/domain/events/domain-event.ts).
  - **Puertos de Escritura / Dominio (`repositories/`, `ports/`)**: Deben declararse como **`abstract class` puras** (no `interface` de TypeScript ni `@Inject(Symbol)`), ya que NestJS las utiliza directamente como tokens de inyección de dependencias.
  - **Excepciones de Dominio**: Heredan de [`DomainException`](src/shared/domain/exceptions/domain.exception.ts).

### 1.2 Capa de Aplicación (`src/**/application/`)
- **Regla de oro**: Orquesta casos de uso sin conocer Prisma, HTTP, Express ni XState. Únicamente se permite importar `@nestjs/cqrs` (`@CommandHandler`, `@QueryHandler`, `ICommandHandler`, `IQueryHandler`, `CommandBus`, `QueryBus`).
- **Contenido**:
  - **Commands & Queries (`commands/`, `queries/`)**: Separación CQRS por caso de uso (`*.command.ts` / `*.handler.ts`, `*.query.ts` / `*.handler.ts`).
  - **Application Services (`services/`)**: Clases TypeScript puras **sin decorador `@Injectable()`** registradas en infraestructura mediante la fábrica [`registerService(ServiceClass, [deps])`](src/shared/infrastructure/factories/register-service.factory.ts).
  - **Puertos de Lectura (`application/repositories/` o `application/*/ports/`)**: `abstract class` como `*ReadRepository` o `*QueriesRepository` para consultas paginadas/DTO sin hidratar agregados completos.
  - **DTOs e Excepciones de Aplicación**: Contratos internos y excepciones (`ApplicationException`, `ForbiddenException`, `UnauthorizedException`).

### 1.3 Capa de Infraestructura (`src/**/infrastructure/`)
- **Regla de oro**: Implementa los contratos abstractos de dominio y aplicación conectándolos con NestJS, PostgreSQL/Prisma, Redis, BullMQ y HTTP.
- **Contenido**:
  - **Controllers (`controllers/`)**: Validan entrada (`class-validator`), aplican `@SkipAuth()`, `@Permissions(...)`, `@OwnsResource(...)`, `@CheckAuthenticatedUser(...)`, `@Transactional()` y `@Auditable(...)`, y delegan al `CommandBus`/`QueryBus`.
  - **Repositorios Prisma (`implementation/` o `persistence/`)**: Implementan simultáneamente el puerto de dominio (`*Repository`) y el de lectura (`*ReadRepository`/`*QueriesRepository`) sobre `this.prisma.client` (`PrismaService`). Está **prohibido** llamar a `$transaction(` dentro de `*repository*`.
  - **Configuración DI por Módulo (`config/`)**:
    - `repositories.config.ts` (vincula `abstract class` -> `useClass: Impl*`)
    - `services.config.ts` (instancia services vía `registerService`)
    - `commands-handlers.config.ts` y `queries-handlers.config.ts`
  - **Adapters**: `ImplPasswordHasherPort`, `JwtTokenHasher`, `ImplAuthPort`, `DayjsDateAdapter`, `PinoLoggerAdapter`, `EmailQueueService`, `LocalStorageBackend`, `S3StorageBackend`, `CatalogCacheService`, `XStateEngineAdapter`.
  - **Suscriptores y Procesadores (`subscribers/`, `processors/`)**: `@EventsHandler` en API HTTP y `@Processor` BullMQ ejecutados en `WorkerModule` (`src/worker.ts`).
  - **Guards, Middlewares e Interceptors**: `ThrottlerGuard`, `JwtPassportAuthGuard`, `PermissionsGuard`, `LoginThrottleGuard`, `CheckAuthenticatedUserGuard`, `OwnsResourceGuard`, `IdempotencyMiddleware`, `BullBoardAuthMiddleware`, `TransactionInterceptor`, `AuditableInterceptor`, `BigIntTransformInterceptor`.
- **Política cero `as`**: Ningún archivo productivo en `src/` puede usar aserciones de tipo `as <Tipo>` (solo `as const`).

---

## 2. Transacciones `@Transactional()` y Publicación Post-Commit (`After-Commit`)

Para garantizar atomicidad sin acoplar los handlers a Prisma ni disparar correos o invalidaciones ante un rollback:

```text
Request HTTP (Controller con @Transactional())
   │
   ▼
TransactionInterceptor (Global APP_INTERCEPTOR)
   │  Detecta @Transactional() en el método controlador
   │  Abre prisma.$transaction() y crea contexto ALS en TransactionContextService
   │
   ▼
CommandHandler / Application Service
   │  Ejecuta repositorios que acceden a `this.prisma.client` (cliente TX activo en ALS)
   │  Invoca `eventPublisher.publish(...)` (TransactionAwareEventPublisher)
   │     └─► ¿TX activa? SÍ ─► Encola despacho en `afterCommitHooks` del ALS
   │  AuditableInterceptor (en métodos con @Auditable)
   │     └─► ¿TX activa? SÍ ─► Encola `auditLog.log(...)` en `afterCommitHooks`
   │
   ▼
Commit de PostgreSQL en TransactionInterceptor
   │
   ├── Commit exitoso:
   │     Ejecuta secuencialmente cada callback en `afterCommitHooks`
   │       ├─► Nest EventBus despacha @EventsHandler (ej. InvalidateMenuCacheSubscriber)
   │       └─► AuditLogService persiste en `mnt_audit_log`
   │
   └── Si ocurre error / Rollback en TX:
         PostgreSQL revierte todas las escrituras.
         Se descartan `afterCommitHooks` de éxito; si @Auditable define `failureAction`,
         AuditableInterceptor registra el fallo inmediatamente fuera de TX (`prisma.rootClient`).
```

*(Nota: Los envíos de correo actuales en `iam` encolan jobs en BullMQ mediante `EmailSenderPort` -> `EmailQueueService`, procesados en segundo plano por `WorkerModule`; para nuevos módulos se recomienda publicar `DomainEvent` vía `TransactionAwareEventPublisher` asegurando así que ningún job salga antes del commit).*

---

## 3. Estructura Canónica de un Nuevo Módulo

Ejemplo de layout recomendado en `src/modules/<modulo>/`:

```text
src/modules/billing/
├── domain/
│   ├── aggregates/
│   │   └── invoice.aggregate.ts             # Extiende AggregateRoot
│   ├── entities/                            # Sub-entidades gobernadas por VOs
│   ├── events/
│   │   └── invoice-created.event.ts         # Extiende DomainEvent
│   ├── repositories/
│   │   └── invoice.repository.ts            # export abstract class InvoiceRepository
│   └── value-objects/                       # Validados con Validator.of(...)
├── application/
│   ├── dtos/
│   │   └── invoice.dto.ts
│   ├── repositories/
│   │   └── invoice-read.repository.ts       # export abstract class InvoiceReadRepository
│   ├── services/
│   │   └── invoice-lookup.service.ts        # Clase pura SIN @Injectable()
│   └── invoice/
│       ├── commands/create-invoice/         # CreateInvoiceCommand + CreateInvoiceHandler
│       └── queries/get-invoices/            # GetInvoicesQuery + GetInvoicesHandler
├── infrastructure/
│   ├── config/
│   │   ├── commands-handlers.config.ts
│   │   ├── queries-handlers.config.ts
│   │   ├── repositories.config.ts           # provide: InvoiceRepository, useClass: ImplInvoiceRepository
│   │   └── services.config.ts               # registerService(InvoiceLookupService, [...])
│   ├── controllers/
│   │   └── invoice.controller.ts            # @ApiBearerAuth('JWT-auth'), @Permissions, @Transactional
│   ├── dtos/                                # Validators class-validator, QueryDto y *HttpDto
│   ├── implementation/
│   │   └── impl-invoice.repository.ts       # Implements InvoiceRepository, InvoiceReadRepository
│   └── subscribers/
│       └── invoice-created.subscriber.ts    # @EventsHandler(InvoiceCreatedEvent)
└── billing.module.ts                        # Registra RouterModule si aplica + providers de config/
```

### Registro en `AppModule`
Importar `BillingModule` dentro de `imports` en [`src/app.module.ts`](src/app.module.ts) (y en [`src/worker.module.ts`](src/worker.module.ts) únicamente si define `@Processor` de BullMQ propios). Si requiere migraciones/modelos nuevos, añadirlos a [`prisma/schema.prisma`](prisma/schema.prisma).

---

## 4. Pruebas Automatizadas y Verificación Continua

1. **Pruebas de Arquitectura ([`test/architecture.spec.ts`](test/architecture.spec.ts) — 5 reglas)**:
   - Valida fronteras de `domain/`, `application/`, `shared/`, prohíbe `$transaction(` dentro de `*repository*` y bloquea aserciones `as <Tipo>` en código productivo.
2. **Pruebas Unitarias (`src/**/*.spec.ts` y `test/unit/**/*.spec.ts`)**:
   - Ejecutadas con Vitest 4 (`vitest.config.ts`), precargando `xstate-engine.adapter.ts` y aislando adaptadores con mocks.
3. **Pruebas E2E (`test/**/*.e2e-spec.ts`)**:
   - Ejecutadas con `vitest.config.e2e.ts` para validar el arranque de NestJS, endpoints de salud/métricas y contratos HTTP.
4. **Gate de Calidad (`npm run check`)**:
   - Ejecuta `oxlint --type-aware src/ test/ --max-warnings=0` y `tsc --noEmit -p tsconfig.json`.

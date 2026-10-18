# Guía Técnica: Arquitectura Hexagonal en NestJS 12

> **Documento normativo de arquitectura para `hexagonal_template_nestjs`. Define las directrices de capas, puertos, adaptadores, eventos de dominio y buenas prácticas.**

---

## 1. Las Tres Capas y sus Responsabilidades

### 1.1 Capa de Dominio (`src/**/domain/`)
- **Regla de oro**: Cero dependencias de infraestructura o librerías externas. Solo TypeScript puro.
- **Contenido**:
  - **Entidades y Agregados**: Modelos ricos que encapsulan estado e invariantes. Extienden `AggregateRoot`.
  - **Value Objects**: Clases inmutables para valores con validación semántica (ej. `UserName`, `Email`, `Id`).
  - **Eventos de Dominio**: Clases inmutables que heredan de `DomainEvent`.
  - **Puertos de Dominio**: Interfaces para contratos del núcleo de negocio (ej. `UserRepository`).
  - **Excepciones de Dominio**: Heredan de `DomainException`.

### 1.2 Capa de Aplicación (`src/**/application/`)
- **Regla de oro**: Orquesta el flujo de casos de uso sin conocer detalles de base de datos o transporte HTTP.
- **Contenido**:
  - **Application Services / Handlers**: Orquestan entidades, puertos y transacciones.
  - **DTOs de Entrada / Salida**: Estructuras de datos para intercambiar información con el exterior.
  - **Puertos de Aplicación**: Interfaces para servicios de soporte (ej. `EventPublisherPort`, `LoggerPort`, `DateProviderPort`).
  - **Excepciones de Aplicación**: Casos de uso no satisfechos (ej. `NotFoundException`, `ConflictException`).

### 1.3 Capa de Infraestructura (`src/**/infrastructure/`)
- **Regla de oro**: Implementa las interfaces definidas en dominio y aplicación utilizando tecnologías específicas.
- **Contenido**:
  - **Controllers**: Adapters HTTP de entrada que reciben peticiones, invocan la capa de aplicación y mapean respuestas.
  - **Repositorios Prisma**: Implementaciones concretas de interfaces de repositorio usando `PrismaService`.
  - **Adapters**: `BcryptPasswordHasher`, `DayjsDateAdapter`, `PinoLoggerAdapter`, etc.
  - **Subscriptores (`@EventsHandler`)**: Escuchan eventos de dominio para ejecutar efectos secundarios asíncronos (email, cache, auditoría).
  - **Guards e Interceptors**: `TransactionInterceptor`, `OwnsResourceGuard`, `PermissionsGuard`, `ThrottlerGuard`.

---

## 2. Publicación de Eventos Transaccionales (After-Commit)

En transacciones de base de datos, los efectos secundarios (como enviar emails o invalidar caches) no deben ejecutarse antes de que la transacción se confirme satisfactoriamente.

```
Request HTTP
   │
   ▼
TransactionInterceptor (Inicia $transaction en AsyncLocalStorage)
   │
   ▼
Application Service / Handler
   │  modifica entidad
   │  user.record(new UserRegisteredDomainEvent(...))
   │  await userRepository.save(user)
   │  await eventPublisher.publish(user.pullDomainEvents())
   │        │
   │        ▼
   │  TransactionAwareEventPublisher
   │  ¿Transacción activa? ──► SÍ: Registra evento en `afterCommitHooks`
   │
   ▼
TransactionInterceptor
   │
   ├── Commit de DB exitoso
   │        │
   │        ▼
   │     Ejecuta `afterCommitHooks`:
   │     await eventBus.publish(event)
   │        │
   │        ├──► SendEmailVerificationSubscriber (BullMQ)
   │        ├──► InvalidateRoleCacheSubscriber (Redis)
   │        └──► AuditIamSubscriber (AuditLogService)
   │
   └── Si ocurre Rollback:
         Descarta hooks. Ningún email ni auditoría errónea se despacha.
```

---

## 3. Guía de Creación de un Nuevo Módulo

Para añadir un nuevo módulo al proyecto (ej. `billing`):

```
src/modules/billing/
├── domain/
│   ├── entities/
│   │   └── invoice.entity.ts       # Extends AggregateRoot
│   ├── events/
│   │   └── invoice-created.event.ts # Extends DomainEvent
│   ├── repositories/
│   │   └── invoice.repository.ts   # Interface pura
│   └── value-objects/
├── application/
│   ├── dtos/
│   │   ├── create-invoice.dto.ts
│   │   └── invoice-response.dto.ts
│   └── services/
│       └── invoice.service.ts      # Orquesta casos de uso
├── infrastructure/
│   ├── controllers/
│   │   └── invoice.controller.ts   # Endpoints HTTP
│   ├── persistence/
│   │   └── prisma-invoice.repository.ts # Implements InvoiceRepository
│   └── subscribers/
│       └── invoice-created.subscriber.ts # Reacts to InvoiceCreatedEvent
└── billing.module.ts
```

### Registro en `AppModule`
Registrar `BillingModule` en `src/app.module.ts` dentro del array `imports`.

---

## 4. Pruebas Automatizadas

1. **Pruebas de Arquitectura (`test/architecture.spec.ts`)**:
   - Escanea todos los archivos del proyecto y valida que ningún archivo en `domain/` o `application/` importe librerías prohibidas o capas externas.
2. **Pruebas Unitarias (`src/**/*.spec.ts`)**:
   - Ejecutadas con Vitest en memoria. Aisladas mediante mocks de puertos.
3. **Pruebas E2E (`test/**/*.e2e-spec.ts`)**:
   - Validan arranque de la aplicación NestJS, enrutamiento, middleware y contratos HTTP.

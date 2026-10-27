# Reglas y Políticas de Desarrollo: `hexagonal_template_nestjs`

> **Documento normativo de arquitectura, desarrollo y calidad para la plantilla backend NestJS.**
> Aplica para todos los desarrolladores y agentes de inteligencia artificial que trabajen en este repositorio.

---

## 1. Visualización de Planes de Trabajo

- Siempre que se proponga o elabore un plan de trabajo, arquitectura o refactorización:
  1. Generar un artefacto Markdown de visualización detallado en el directorio de artefactos (`brain/<conversation-id>/...`).
  2. El artefacto debe contener la arquitectura, diagramas Mermaid, tabla de componentes afectados, pasos de ejecución y estrategia de validación.
  3. Establecer `RequestFeedback: true` en el metadata del artefacto cuando se requiera aprobación interactiva del usuario antes de ejecutar.

---

## 2. Protocolo Obligatorio de Calidad (Type Check + Lint)

- Después de implementar cualquier característica, refactorización o corrección, SIEMPRE ejecutar la verificación de tipos y el linter antes de dar la tarea por terminada, y corregir todo hallazgo (el CI falla con warnings):
  ```bash
  npm run check        # lint:ci (oxlint --max-warnings=0) + typecheck (tsc --noEmit)
  npm test             # pruebas unitarias y test/architecture.spec.ts (si se tocó lógica o estructura)
  ```
- Si hubo cambios estructurales de configuración o dependencias, ejecutar además:
  ```bash
  npm run build
  ```

---

## 3. Reglas Inviolables de Arquitectura Hexagonal

### 3.1. Capa de Dominio (`src/**/domain/`)
- **Regla de oro**: Cero dependencias externas o de frameworks (prohibido `@nestjs/*`, `@prisma/*`, o librerías ORM/transporte). Solo TypeScript puro.
- **Agregados (`domain/aggregates/`)**:
  - Extienden obligatoriamente `AggregateRoot` (`@/shared/domain/aggregate-root`).
  - Orquestan la lógica compleja, protegen invariantes y acumulan eventos de dominio mediante `this.record(new DomainEvent(...))`.
  - Su constructor y métodos públicos pueden recibir tipos primitivos (`string`, `number`) e instanciar sus Value Objects internamente.
  - Son los únicos que se persisten directamente a través de los repositorios de dominio.
- **Entidades (`domain/entities/`)**:
  - Representan objetos subordinados a un agregado o catálogos simples.
  - Están **estrictamente obligadas a recibir Value Objects instanciados en su constructor**.
  - Proveen una factoría estática `static create(data: { ... }): Entidad` para recibir primitivos e instanciar los Value Objects.
- **Value Objects (`domain/value-objects/`)**:
  - Clases inmutables con responsabilidad exclusiva de autovalidarse.
  - Obligatorio usar `Validator.of(value, msg => new InvalidValueObjectException('<NombreVO>', msg))` (`@/shared/domain/validator/validator-value-object`).
- **Puertos de Repositorio de Dominio (`domain/repositories/`)**:
  - Definir como **clases abstractas** (`export abstract class <Entidad>Repository`), **NUNCA como `interface` pura de TypeScript**, para funcionar como tokens nativos de inyección de dependencias en NestJS sin ensuciar con `@Inject(Symbol)`.

### 3.2. Capa de Aplicación (`src/**/application/`)
- **Orquestación mediante CQRS**:
  - **Commands (`commands/`)**: Mutan estado mediante `@CommandHandler`. Instancian la entidad/agregado y persisten vía puerto de dominio.
  - **Queries (`queries/`)**: Leen estado mediante `@QueryHandler`. Implementan *Bypass de Dominio* devolviendo DTOs de lectura planos directamente.
- **Caché en Consultas de Listado**:
  - La petición limpia (*hot-path*) se consulta en Redis con `CatalogCacheService` y se exportan las constantes `*_CACHE_KEYS`.
  - Consultas con filtros dinámicos o paginación (`PaginationParams`) eluden la caché (*cache bypass*).
  - Los Commands invalidan oportunamente las claves exportadas con `await this.cache.invalidate(...)`.
- **Servicios de Aplicación (`application/services/`)**:
  - Actúan como la API interna del módulo para comunicación cross-module inyectando `CommandBus` y `QueryBus`.
  - **Prohibido decorarlos con `@Injectable()`**. Se registran en NestJS mediante la factoría `registerService` en `infrastructure/config/services.config.ts`.

### 3.3. Capa de Infraestructura (`src/**/infrastructure/`)
- **Controladores (`infrastructure/controllers/`)**:
  - Endpoints HTTP protegidos obligatoriamente con `@Permissions('slug-permiso')` y `@ApiBearerAuth('JWT-auth')`.
  - Documentados con `@ApiTags`, `@ApiParam`, `@ApiQuery`.
  - Respuestas estandarizadas en `SuccessResponseDto` o `HttpPaginatedResponseDto`.
- **DTOs Segregados**:
  - *Validadores*: `Create*Dto`, `Update*Dto` con `class-validator` y `@nestjs/swagger`.
  - *HTTP Salientes*: `*HttpDto` sin validadores, con método estático de fábrica `fromDto()`.
  - *Query*: `Get*QueryDto` combinando paginación y filtros mediante `IntersectionType`.
- **Persistencia Prisma Dual (`infrastructure/implementation/`)**:
  - Una única clase `Impl*Repository` implementa el puerto de dominio (`*Repository`) y el de lectura (`*QueriesRepository`).
  - Todas las operaciones de Prisma se envuelven en `try/catch` lanzando `DatabaseException`.

### 3.4. Publicación Transaccional After-Commit
- Los eventos acumulados en la entidad (`entity.pullDomainEvents()`) se publican mediante `TransactionAwareEventPublisher`.
- Si hay una transacción activa en `AsyncLocalStorage` (`TransactionContextService`), los eventos se retienen y despachan únicamente tras el commit exitoso en BD (`afterCommitHooks`), activando suscriptores de BullMQ, Redis o `AuditLogService`.

---

## 4. Habilidades Disponibles en este Repositorio (`.agents/skills/`)

- `nestjs-hexagonal-module-scaffolder`: Andamiaje guiado completo de módulos en las 3 capas.
- `nestjs-cqrs-cache-handler`: Patrón estándar de caché y bypass en queries CQRS.
- `nestjs-domain-event-subscriber`: Creación de eventos transaccionales y suscriptores BullMQ.
- `fullstack-contract-sync`: Mapeo de contratos y DTOs hacia frontend Vue 3.
- `prisma-*`: Gestión de esquemas, migraciones y cliente Prisma 7.

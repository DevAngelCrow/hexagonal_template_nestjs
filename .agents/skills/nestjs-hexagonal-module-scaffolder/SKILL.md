---
name: nestjs-hexagonal-module-scaffolder
description: Use this skill when the user asks to create, scaffold, or refactor a business module in hexagonal_template_nestjs following strict Hexagonal Architecture (Domain, Application, Infrastructure), CQRS with NestJS, Value Objects with Validator.of, dual Prisma repositories, services.config.ts, and module wiring.
---

# Scaffolder de Módulos: Arquitectura Hexagonal en NestJS 12

Esta habilidad es el runbook normativo y procedimental para crear un nuevo módulo en `hexagonal_template_nestjs` cumpliendo al 100% las directrices de `GUIA_CREACION_MODULO.md`, `TECHNICAL_GUIDE.md` y `README.md`, garantizando que `test/architecture.spec.ts` y `npm run check` pasen con 0 errores y 0 advertencias.

---

## 1. Estructura Exacta del Módulo

Al crear un módulo `<nombre-modulo>` (ej. `inventory`, `billing`, `suppliers`), la estructura de carpetas debe ser:

```text
src/modules/<nombre-modulo>/
├── domain/
│   ├── aggregates/               # Extiende AggregateRoot (ej. product.ts)
│   ├── entities/                 # Entidades subordinadas (si aplica)
│   ├── value-objects/            # Clases inmutables con Validator.of
│   ├── repositories/             # Puertos: Clases abstractas (ej. product.repository.ts)
│   └── events/                   # Hereda de DomainEvent (ej. product-created.event.ts)
│
├── application/
│   ├── dtos/                     # DTOs de aplicación puros TypeScript (ej. product.dto.ts)
│   ├── services/                 # API interna (ej. inventory.service.ts) usando buses
│   └── <nombre-entidad>/
│       ├── commands/
│       │   └── create-<entidad>/ # create-product.command.ts y .handler.ts
│       └── queries/
│           ├── get-<entidad>/    # get-product.query.ts y .handler.ts
│           └── get-<entidades>/  # get-products.query.ts y .handler.ts (con caché)
│
├── infrastructure/
│   ├── config/
│   │   └── services.config.ts    # Factoría registerService para Application Services
│   ├── controllers/
│   │   └── <entidad>.controller.ts # REST endpoints con @Permissions y Swagger
│   ├── dtos/
│   │   ├── validators/           # Create*Dto, Update*Dto con class-validator
│   │   ├── http/                 # *HttpDto con método estático fromDto()
│   │   └── query/                # Get*QueryDto con IntersectionType
│   └── implementation/
│       └── impl-<entidad>.repository.ts # Implementa puertos de Dominio y Lectura
│
└── <nombre-modulo>.module.ts     # Orquestador del módulo en NestJS
```

---

## 2. Reglas Críticas Inviolables

1. **Dominio 100% Puro**:
   - PROHIBIDO importar `@nestjs/*`, `@prisma/*`, librerías ORM o de transporte en `src/**/domain/`.
   - Repositorios de Dominio: Declarar como `export abstract class <Entidad>Repository`, NUNCA como `interface`. Esto permite usar la clase como token nativo de inyección.
2. **Diferencia Crítica entre Agregados y Entidades**:
   - **Agregados (`domain/aggregates/`)**: Extienden obligatoriamente `AggregateRoot` (`@/shared/domain/aggregate-root`). Orquestan la lógica compleja, protegen invariantes, acumulan eventos de dominio (`this.record(...)`) y son los únicos que se persisten directamente a través de repositorios de dominio. Su constructor y métodos públicos pueden recibir primitivos (`string`, `number`) e internamente instanciar sus Value Objects correspondientes.
   - **Entidades (`domain/entities/`)**: Representan objetos de negocio con identidad única que están subordinados a un Agregado o modelan catálogos simples. Tienen la **obligación estricta de recibir exclusivamente Value Objects en su constructor**. Para instanciarlas a partir de valores primitivos, deben proveer un método estático de fábrica `static create(data: { ... }): Entidad`.
3. **Value Objects**:
   - Cada propiedad debe validarse con `Validator.of(value, msg => new InvalidValueObjectException('<NombreVO>', msg))` importado de `@/shared/domain/...`.
4. **Aplicación Desacoplada**:
   - No usar decoradores de infraestructura ni `@Injectable()` en servicios de aplicación. El registro se delega a `infrastructure/config/services.config.ts` mediante `registerService`.
   - Se permite la excepción pragmática de `@nestjs/cqrs` (`@CommandHandler`, `@QueryHandler`, `ICommandHandler`, `IQueryHandler`).
5. **Infraestructura y Persistencia**:
   - `Impl<Entidad>Repository` implementa simultáneamente el repositorio de dominio (Commands) y el repositorio de queries (Queries con bypass de dominio).
   - Toda operación Prisma debe envolverse en `try/catch` lanzando `DatabaseException('Mensaje', 'operacion')`.
6. **Controladores y Seguridad**:
   - Cada endpoint debe estar protegido con `@Permissions('slug-permiso')` y `@ApiBearerAuth('JWT-auth')`.
   - Respuestas envueltas en `SuccessResponseDto` o `HttpPaginatedResponseDto`.

---

## 3. Secuencia de Ejecución Paso a Paso

### Paso 1: Capa de Dominio

1. **Value Objects** (`domain/value-objects/<entidad>-<propiedad>.ts`):
```typescript
import { InvalidValueObjectException } from '@/shared/domain/exceptions/invalid-value-object.exception';
import { Validator } from '@/shared/domain/validator/validator-value-object';

export class ProductName {
  private readonly _value: string;

  constructor(value: string) {
    this._value = Validator.of(
      value,
      (msg) => new InvalidValueObjectException('ProductName', msg),
    )
      .required('Product name is required')
      .string('Product name must be a string')
      .maxLength(150, 'Product name must be at most 150 characters long')
      .getValue();
  }

  public value(): string {
    return this._value;
  }

  public equals(other: ProductName): boolean {
    return this._value === other._value;
  }
}
```

2. **Agregado (Aggregate Root)** (`domain/aggregates/<entidad>.ts`):
```typescript
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import { ProductId } from '../value-objects/product-id';
import { ProductName } from '../value-objects/product-name';
import { ProductCreatedDomainEvent } from '../events/product-created.event';

export class Product extends AggregateRoot {
  private readonly id: ProductId;
  private name: ProductName;
  private active: boolean;

  // El Agregado acepta primitivos en su constructor y los transforma a Value Objects internamente
  constructor(id: string, name: string, active: boolean = true) {
    super();
    this.id = new ProductId(id);
    this.name = new ProductName(name);
    this.active = active;
  }

  public static create(id: string, name: string): Product {
    const product = new Product(id, name, true);
    product.record(new ProductCreatedDomainEvent(id, name));
    return product;
  }

  public getId(): ProductId { return this.id; }
  public getName(): ProductName { return this.name; }
  public isActive(): boolean { return this.active; }
}
```

3. **Entidad Subordinada o Catálogo** (`domain/entities/<entidad>.ts`):
A diferencia del agregado, la **Entidad en su constructor exige obligatoriamente Value Objects ya instanciados**. Se proporciona el método estático de fábrica `create()` para recibir primitivos e instanciar los VOs:

```typescript
import { CategoryStatusId } from '../value-objects/category-status-id';
import { CategoryStatusName } from '../value-objects/category-status-name';
import { CategoryStatusCode } from '../value-objects/category-status-code';
import { CategoryStatusDescription } from '../value-objects/category-status-description';
import { CategoryStatusActive } from '../value-objects/category-status-active';

export class CategoryStatus {
  // Constructor estrictamente tipado con Value Objects (sin primitivos directos)
  constructor(
    private readonly name: CategoryStatusName,
    private readonly code: CategoryStatusCode,
    private readonly description: CategoryStatusDescription,
    private readonly active: CategoryStatusActive,
    private readonly id?: CategoryStatusId,
  ) {}

  // Factoría estática para construir la Entidad a partir de primitivos
  public static create(data: {
    name: string;
    code: string;
    description: string;
    active: boolean;
    id?: string;
  }): CategoryStatus {
    return new CategoryStatus(
      new CategoryStatusName(data.name),
      new CategoryStatusCode(data.code),
      new CategoryStatusDescription(data.description),
      new CategoryStatusActive(data.active),
      data.id ? new CategoryStatusId(data.id) : undefined,
    );
  }

  // Getters devolviendo los Value Objects
  public getName(): CategoryStatusName { return this.name; }
  public getCode(): CategoryStatusCode { return this.code; }
  public getDescription(): CategoryStatusDescription { return this.description; }
  public getActive(): CategoryStatusActive { return this.active; }
  public getId(): CategoryStatusId | undefined { return this.id; }
}
```

4. **Puerto de Repositorio de Dominio** (`domain/repositories/<entidad>.repository.ts`):
```typescript
import { Product } from '../aggregates/product';

export abstract class ProductRepository {
  abstract save(product: Product): Promise<void>;
  abstract findById(id: string): Promise<Product | null>;
  abstract delete(id: string): Promise<void>;
}
```

5. **Puerto de Lectura para Queries** (`application/repositories/<entidad>-read.repository.ts`):
```typescript
import { Pagination } from '@/shared/domain/value-object/pagination';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { ProductDto } from '../dtos/product.dto';

export abstract class ProductQueriesRepository {
  abstract getAll(
    paginationParams?: PaginationParams,
    filter?: string,
    active?: boolean,
  ): Promise<Pagination<ProductDto> | ProductDto[]>;
  abstract getById(id: string): Promise<ProductDto | null>;
}
```

---

### Paso 2: Capa de Aplicación

1. **DTO de Aplicación** (`application/dtos/<entidad>.dto.ts`):
```typescript
export class ProductDto {
  constructor(
    public readonly name: string,
    public readonly active: boolean,
    public readonly id?: string,
  ) {}
}
```

2. **Command & Handler** (`application/<entidad>/commands/create-<entidad>/`):
```typescript
// create-product.command.ts
import { ProductDto } from '../../dtos/product.dto';

export class CreateProductCommand {
  constructor(public readonly productDto: ProductDto) {}
}

// create-product.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { CreateProductCommand } from './create-product.command';
import { Product } from '../../../domain/aggregates/product';
import { ProductRepository } from '../../../domain/repositories/product.repository';
import { EventPublisherPort } from '@/shared/application/ports/event-publisher.port';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(command: CreateProductCommand): Promise<void> {
    const { productDto } = command;
    const id = productDto.id ?? uuidv4();
    const product = Product.create(id, productDto.name);

    await this.productRepository.save(product);
    await this.eventPublisher.publish(product.pullDomainEvents());
  }
}
```

3. **Query & Handler con Caché** (`application/<entidad>/queries/get-<entidades>/`):
- Seguir el patrón de `CatalogCacheService` con bypass de filtros/paginación y exportar `*_CACHE_KEYS` (ver skill `nestjs-cqrs-cache-handler`).

4. **Servicio de Aplicación (Fachada Interna)** (`application/services/<modulo>.service.ts`):
```typescript
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateProductCommand } from '../product/commands/create-product/create-product.command';
import { ProductDto } from '../dtos/product.dto';

export class InventoryService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async createProductInternally(productDto: ProductDto): Promise<void> {
    return this.commandBus.execute(new CreateProductCommand(productDto));
  }
}
```

---

### Paso 3: Capa de Infraestructura

1. **Configuración de Servicios** (`infrastructure/config/services.config.ts`):
```typescript
import { Type, Abstract } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InventoryService } from '../../application/services/inventory.service';
import { registerService } from '@/shared/infrastructure/factories/register-service.factory';

export const services: Array<{
  service: Type<unknown>;
  deps: Array<Type<unknown> | Abstract<unknown>>;
}> = [
  {
    service: InventoryService,
    deps: [CommandBus, QueryBus],
  },
];

export const serviceProviders = services.map((uc) => registerService(uc.service, uc.deps));
```

2. **DTOs de Entrada (Validators)** (`infrastructure/dtos/validators/<entidad>/create-<entidad>.dto.ts`):
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ProductDto } from '../../../application/dtos/product.dto';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @ApiProperty({ example: 'Monitor 4K' })
  name!: string;

  public static toApplicationDto(dto: CreateProductDto): ProductDto {
    return new ProductDto(dto.name, true);
  }
}
```

3. **DTOs de Salida HTTP** (`infrastructure/dtos/http/<entidad>-http.dto.ts`):
```typescript
import { ProductDto } from '../../application/dtos/product.dto';

export class ProductHttpDto {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly active: boolean,
  ) {}

  public static fromDto(dto: ProductDto): ProductHttpDto {
    return new ProductHttpDto(dto.id!, dto.name, dto.active);
  }
}
```

4. **DTO de Consulta con IntersectionType** (`infrastructure/dtos/query/get-<entidades>-query.dto.ts`):
```typescript
import { IntersectionType } from '@nestjs/swagger';
import { PaginationParamsDto } from '@/shared/application/dtos/pagination.dto';
import { FilterNameDto, StatusBooleanFilterDto } from '@/shared/application/dtos/filters';

export class GetProductsQueryDto extends IntersectionType(
  PaginationParamsDto,
  FilterNameDto,
  StatusBooleanFilterDto,
) {}
```

5. **Implementación del Repositorio** (`infrastructure/implementation/impl-<entidad>.repository.ts`):
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service';
import { Product } from '../../domain/aggregates/product';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { ProductQueriesRepository } from '../../application/repositories/product-read.repository';
import { ProductDto } from '../../application/dtos/product.dto';
import { DatabaseException } from '@/shared/infrastructure/exceptions/database.exception';

@Injectable()
export class ImplProductRepository implements ProductRepository, ProductQueriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(product: Product): Promise<void> {
    try {
      await this.prisma.client.product.upsert({
        where: { id: product.getId().value() },
        create: {
          id: product.getId().value(),
          name: product.getName().value(),
          active: product.isActive(),
        },
        update: {
          name: product.getName().value(),
          active: product.isActive(),
        },
      });
    } catch (error) {
      throw new DatabaseException('Error saving product', 'save');
    }
  }

  async findById(id: string): Promise<Product | null> {
    try {
      const record = await this.prisma.client.product.findUnique({ where: { id } });
      if (!record) return null;
      return new Product(record.id, record.name, record.active);
    } catch (error) {
      throw new DatabaseException('Error finding product by id', 'findById');
    }
  }

  // Implementar getAll y getById para ProductQueriesRepository...
}
```

6. **Controlador HTTP** (`infrastructure/controllers/<entidad>.controller.ts`):
```typescript
import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/modules/iam/infrastructure/decorators/permissions.decorator';
import { SuccessResponseDto } from '@/shared/infrastructure/dtos/success-response.dto';
import { CreateProductDto } from '../dtos/validators/create-product.dto';
import { CreateProductCommand } from '../../application/product/commands/create-product/create-product.command';

@ApiTags('Products')
@Controller('products')
@ApiBearerAuth('JWT-auth')
export class ProductController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Permissions('crear-producto')
  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateProductDto): Promise<SuccessResponseDto<null>> {
    const appDto = CreateProductDto.toApplicationDto(dto);
    await this.commandBus.execute(new CreateProductCommand(appDto));
    return new SuccessResponseDto(null, HttpStatus.CREATED, 'Product created successfully');
  }
}
```

---

### Paso 4: Ensamblaje del Módulo

En `src/modules/<modulo>/<modulo>.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ProductController } from './infrastructure/controllers/product.controller';
import { ProductRepository } from './domain/repositories/product.repository';
import { ProductQueriesRepository } from './application/repositories/product-read.repository';
import { ImplProductRepository } from './infrastructure/implementation/impl-product.repository';
import { CreateProductHandler } from './application/product/commands/create-product/create-product.handler';
import { serviceProviders } from './infrastructure/config/services.config';

const CommandHandlers = [CreateProductHandler];
const QueryHandlers = [];

@Module({
  imports: [CqrsModule],
  controllers: [ProductController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...serviceProviders,
    {
      provide: ProductRepository,
      useClass: ImplProductRepository,
    },
    {
      provide: ProductQueriesRepository,
      useClass: ImplProductRepository,
    },
  ],
  exports: [ProductRepository, ProductQueriesRepository, ...serviceProviders],
})
export class InventoryModule {}
```

---

## 4. Validación Obligatoria

Al terminar de crear o modificar cualquier archivo del módulo, ejecuta:
```bash
npm run check        # Verifica linter (oxlint --max-warnings=0) y TypeScript (tsc --noEmit)
npm test             # Ejecuta las pruebas unitarias y test/architecture.spec.ts
```
Cualquier violación en `test/architecture.spec.ts` (por ejemplo, importar `@nestjs` dentro de `domain/`) debe corregirse de inmediato.

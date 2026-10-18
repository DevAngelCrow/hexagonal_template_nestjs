# Guía Detallada: Creación de un Módulo en Arquitectura Hexagonal

Esta guía detalla, de manera granular, cómo construir un módulo dentro de este proyecto, utilizando **Arquitectura Hexagonal (Puertos y Adaptadores)**, **Domain-Driven Design (DDD)** y el patrón **CQRS** (Command Query Responsibility Segregation) en **NestJS**.

---

## 1. Estructura de Carpetas del Módulo

Todo módulo nuevo debe ubicarse dentro de la carpeta `src/modules/` y debe seguir estrictamente la siguiente estructura de directorios:

```text
src/modules/<nombre-del-modulo>/
├── application/         # Casos de uso (Commands/Queries), DTOs y Servicios de Aplicación (API interna)
├── domain/              # Lógica de negocio (Aggregates, Entities, Value Objects, Repositories)
├── infrastructure/      # Controladores, implementaciones de BD, DTOs de entrada
└── <nombre-modulo>.module.ts # Orquestador del módulo en NestJS
```

A continuación, desglosaremos cada capa con un ejemplo detallado basado en un módulo ficticio llamado **`inventory`** (Inventario) con una entidad principal **`Product`**.

---

## 2. Capa de Dominio (`domain`)

La capa de dominio es el núcleo de nuestra aplicación. **No debe tener dependencias de frameworks externos (como NestJS o TypeORM)**. Aquí viven las reglas de negocio.

### Estructura:
```text
domain/
├── aggregates/          # Raíces de Agregado (Aggregate Roots)
├── entities/            # Entidades simples del dominio
├── value-objects/       # Objetos de Valor
├── repositories/        # Puertos (Interfaces) de los repositorios
└── events/              # Eventos de Dominio (opcional)
```

### 2.1. Agregados y Entidades

Es crucial entender la diferencia y la relación entre estos dos conceptos:
- **Agregados (`domain/aggregates`)**: Las Raíces de Agregado (*Aggregate Roots*) son el punto de entrada principal para interactuar con un conjunto de entidades. Orquestan la lógica compleja, protegen las invariantes del negocio y son los únicos que se persisten directamente a través de los repositorios. Para mantener la pureza de la Arquitectura Hexagonal y evitar acoplamiento con NestJS, todos los Agregados deben extender de nuestra clase base puramente TypeScript ubicada en `src/shared/domain/aggregate-root.ts`.
- **Entidades (`domain/entities`)**: Representan objetos con una identidad única dentro del dominio, pero que están subordinados y gobernados por un Agregado. 

**Importante:** Las **Entidades** están estrictamente obligadas a usar *Value Objects* en sus propiedades y constructores. En cambio, los **Agregados** son más flexibles en su API pública: pueden recibir valores primitivos (`string`, `number`) en su constructor o métodos, e internamente instanciar los *Value Objects* correspondientes para asegurar la validación.

**Ejemplo de Agregado: `domain/aggregates/product.ts`**
```typescript
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import { ProductId } from '../value-objects/product-id';
import { ProductName } from '../value-objects/product-name';
import { ProductStock } from '../value-objects/product-stock';
import { ProductPrice } from '../value-objects/product-price';

export class Product extends AggregateRoot {
  private readonly id: ProductId;
  private name: ProductName;
  private stock: ProductStock;
  private price: ProductPrice;

  constructor(id: string, name: string, stock: number, price: number) {
    super();
    this.id = new ProductId(id);
    this.name = new ProductName(name);
    this.stock = new ProductStock(stock);
    this.price = new ProductPrice(price);
  }

  // Comportamiento del dominio (Reglas de negocio)
  public updatePrice(newPrice: number): void {
    // Aquí pueden ir más reglas orquestadas por el agregado
    this.price = new ProductPrice(newPrice);
  }

  // Getters devolviendo los Value Objects
  public getId(): ProductId { return this.id; }
  public getName(): ProductName { return this.name; }
  public getStock(): ProductStock { return this.stock; }
  public getPrice(): ProductPrice { return this.price; }
}
```

**Ejemplo de Entidad: `domain/entities/category-status.ts`**
A diferencia del agregado, la Entidad en su constructor obliga a recibir instanciados todos sus *Value Objects* directamente. Generalmente cuenta con un método `create` estático que sirve de fábrica, recibiendo primitivos e instanciando los *Value Objects*.

```typescript
import { CategoryStatusId } from '../value-objects/category-status-value-object/category-status-id';
import { CategoryStatusName } from '../value-objects/category-status-value-object/category-status-name';
import { CategoryStatusCode } from '../value-objects/category-status-value-object/category-status-code';
import { CategoryStatusDescription } from '../value-objects/category-status-value-object/category-status-description';
import { CategoryStatusActive } from '../value-objects/category-status-value-object/category-status-active';

export class CategoryStatus {
  constructor(
    private readonly name: CategoryStatusName,
    private readonly code: CategoryStatusCode,
    private readonly description: CategoryStatusDescription,
    private readonly active: CategoryStatusActive,
    private readonly id?: CategoryStatusId,
  ) {}

  static create(data: {
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

  public getName(): CategoryStatusName { return this.name; }
  public getCode(): CategoryStatusCode { return this.code; }
  public getDescription(): CategoryStatusDescription { return this.description; }
  public getActive(): CategoryStatusActive { return this.active; }
  public getId(): CategoryStatusId | undefined { return this.id; }
}
```

### 2.2. Value Objects (`domain/value-objects`)
Son objetos inmutables que no tienen identidad propia; se definen por sus atributos. En nuestra plantilla, **tienen la responsabilidad exclusiva de autovalidarse**.
Para crearlos, utilizamos una clase `Validator` provista por el core (`src/shared/domain/validator/validator-value-object`) y, en caso de error, arrojamos excepciones específicas de dominio como `InvalidValueObjectException`.

**Ejemplo: `domain/value-objects/category-status-description.ts`**
```typescript
import { InvalidValueObjectException } from 'src/shared/domain/exceptions/invalid-value-object.exception';
import { Validator } from 'src/shared/domain/validator/validator-value-object';

export class CategoryStatusDescription {
  private readonly _value: string;

  constructor(value: string) {
    this._value = Validator.of(
      value,
      (msg) => new InvalidValueObjectException('CategoryStatusDescription', msg),
    )
      .required('Category status description is required')
      .string('Category status description must be a string')
      .maxLength(150, 'Category status description must be at most 150 characters long')
      .getValue();
  }

  public value(): string {
    return this._value;
  }

  public equals(other: CategoryStatusDescription): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
```

### 2.3. Repositorios - Puertos (`domain/repositories`)
Son las interfaces (contratos) que la infraestructura deberá implementar. El dominio dicta **qué** necesita, no **cómo** se obtiene. En esta plantilla utilizamos **clases abstractas** en lugar de interfaces (pura sintaxis de TypeScript) para que funcionen como tokens de inyección directos en NestJS, sin necesidad de ensuciar el código con `@Inject(Symbol)`.

**Ejemplo: `domain/repositories/product.repository.ts`**
```typescript
import { Product } from '../aggregates/product';

export abstract class ProductRepository {
  abstract save(product: Product): Promise<void>;
  abstract findById(id: string): Promise<Product | null>;
  abstract findAll(): Promise<Product[]>;
}
```

---

## 3. Capa de Aplicación (`application`)

La capa de aplicación orquesta los casos de uso. Recibe solicitudes de la infraestructura, interactúa con el dominio y devuelve un resultado. Utilizamos el patrón **CQRS**, dividiendo las operaciones en **Commands** (mutan estado) y **Queries** (leen estado).

> [!NOTE]
> **Nota Arquitectónica sobre `@nestjs/cqrs`:** En la capa de aplicación se importan elementos del paquete `@nestjs/cqrs` (como `@CommandHandler`, `@QueryHandler`, e interfaces). Aunque, de manera estricta, esto acopla la capa de aplicación al framework (rompiendo el principio de pureza absoluta de la arquitectura hexagonal), **es una convención pragmática ampliamente aceptada en la comunidad y debatida en distintos foros**. El consenso general es que mantener esta capa totalmente agnóstica exigiría un esfuerzo desproporcionado, llenando la capa de infraestructura con multitud de archivos adaptadores (buses personalizados, wrappers, etc.) que complican excesivamente el desarrollo y el mantenimiento. Por lo tanto, se permite esta importación específica como una excepción práctica y productiva. Por el contrario, la capa de **Dominio** sí permanece estrictamente pura, agnóstica y sin ninguna dependencia externa.

### Estructura:
```text
application/
├── dtos/                # Data Transfer Objects propios de la capa de aplicación
├── services/            # Servicios de Aplicación (API interna expuesta a otros módulos)
└── <nombre-entidad>/    # Agrupado por entidad/funcionalidad
    ├── commands/
    │   └── create-product/
    │       ├── create-product.command.ts
    │       └── create-product.handler.ts
    └── queries/
        └── get-product/
            ├── get-product.query.ts
            └── get-product.handler.ts
```

### 3.1. Commands (`application/<entidad>/commands`)

**El Comando (DTO del caso de uso): `create-product/create-product.command.ts`**
```typescript
import { ProductDto } from '../../dtos/product.dto';

export class CreateProductCommand {
  constructor(public readonly product_dto: ProductDto) {}
}
```

**El Manejador (Handler): `create-product/create-product.handler.ts`**
```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateProductCommand } from './create-product.command';
import { Product } from '../../../domain/aggregates/product';
import { ProductRepository } from '../../../domain/repositories/product.repository';
import { v4 as uuidv4 } from 'uuid'; // Ejemplo de generación de ID

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(command: CreateProductCommand): Promise<void> {
    const { product_dto } = command;

    // 1. Instanciar el objeto de dominio
    const product = new Product(
      uuidv4(),
      product_dto.name,
      product_dto.stock,
      product_dto.price
    );

    // 2. Persistir a través del puerto del repositorio
    await this.productRepository.save(product);
  }
}
```

### 3.2. Queries (`application/<entidad>/queries`)
Siguen la misma lógica que los comandos, pero utilizando `@QueryHandler` e implementando `IQueryHandler`. Suelen retornar modelos de lectura planos (Read Models) o DTOs de aplicación en lugar de entidades completas de dominio para optimizar consultas y evitar acoplamiento.

**La Consulta (DTO de lectura): `get-product/get-product.query.ts`**
```typescript
export class GetProductQuery {
  constructor(public readonly id: string) {}
}
```

**El Manejador de la Consulta: `get-product/get-product.handler.ts`**
```typescript
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { GetProductQuery } from './get-product.query';
import { ProductRepository } from '../../../domain/repositories/product.repository';
import { ProductDto } from '../../dtos/product.dto';

@QueryHandler(GetProductQuery)
export class GetProductHandler implements IQueryHandler<GetProductQuery> {
  constructor(
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(query: GetProductQuery): Promise<ProductDto> {
    const product = await this.productRepository.findById(query.id);

    if (!product) {
      throw new NotFoundException('Product', query.id);
    }

    // Mapeamos la Entidad de Dominio hacia un DTO de Aplicación para retornar
    return new ProductDto(
      product.getName().value(),
      product.getStock().value(),
      product.getPrice().value(),
      product.getId().value()
    );
  }
}
```

**Estándar para Queries de Listado (GetAll con Caché)**

Para consultas generales que devuelven múltiples registros, en esta plantilla existe un estándar claro para balancear rendimiento y consistencia: **Las peticiones con filtros o paginación eluden (bypass) la caché**, mientras que la petición "limpia" (Hot path) **se almacena en caché**. 

Además, es indispensable exportar las llaves de caché (`CACHE_KEYS`) al final del archivo para que los Commands que muten estos datos (crear, actualizar, eliminar) puedan importarlas e invalidar la caché oportunamente.

**Ejemplo: `get-products/get-products.handler.ts`**
```typescript
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Pagination } from '@/shared/domain/value-object/pagination';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { CatalogCacheService } from '@/shared/infrastructure/cache/catalog-cache.service';
import { GetProductsQuery } from './get-products.query';
import { ProductQueriesRepository } from '../../../domain/repositories/product-read.repository';
import { ProductDto } from '../../dtos/product.dto';

const PRODUCTS_ALL_CACHE_KEY = 'catalogs:products:all';
const PRODUCTS_ALL_TTL_SECONDS = 3600; // 1 hora de TTL

@QueryHandler(GetProductsQuery)
export class GetProductsHandler implements IQueryHandler<GetProductsQuery> {
  constructor(
    private readonly repository: ProductQueriesRepository,
    private readonly cache: CatalogCacheService,
  ) {}

  async execute(
    query: GetProductsQuery,
  ): Promise<Pagination<ProductDto> | ProductDto[]> {
    // 1. Paginación: Eludimos la caché (Cache Bypass)
    if (query.pagination_params) {
      const paginationParams = PaginationParams.create({
        ...query.pagination_params,
      });
      return await this.repository.getAll(
        paginationParams,
        query.filter,
        query.active,
      );
    }
    
    // 2. Filtros: También eludimos la caché
    if (query.filter || query.active !== undefined) {
      return await this.repository.getAll(
        undefined,
        query.filter,
        query.active,
      );
    }
    
    // 3. Hot path: Sin parámetros. Obtenemos de caché o consultamos BD.
    return this.cache.fetch<ProductDto[]>(
      PRODUCTS_ALL_CACHE_KEY,
      PRODUCTS_ALL_TTL_SECONDS,
      async () => {
        const result = await this.repository.getAll(
          undefined,
          undefined,
          undefined,
        );
        // Dependiendo del tipo devuelto por el repo, normalizamos a arreglo
        return Array.isArray(result) ? result : result.getEntityList();
      },
    );
  }
}

// Exportamos las llaves para que los Commands (ej. CreateProductHandler) 
// puedan hacer: await this.cache.invalidate(PRODUCTS_CACHE_KEYS.ALL)
export const PRODUCTS_CACHE_KEYS = {
  ALL: PRODUCTS_ALL_CACHE_KEY,
} as const;
```

### 3.3. DTOs de Aplicación (`application/dtos`)
Utilizamos y creamos DTOs en la capa de aplicación para transferir datos hacia y desde las interfaces de usuario o infraestructura, sin acoplar el dominio ni depender de librerías de validación externas como `class-validator` (esas se quedan en infraestructura). La convención de nombres en esta capa es **`[NombreEntidad]Dto`**. Suelen usarse como respuesta en los *Query Handlers* o como carga útil (payload) centralizada en los *Commands*.

**Ejemplo: `application/dtos/product.dto.ts`**
```typescript
export class ProductDto {
  constructor(
    public readonly name: string,
    public readonly stock: number,
    public readonly price: number,
    public readonly id?: string,
  ) {}
}
```

### 3.4. Servicios de Aplicación (`application/services`)
Actúan como la API interna (o fachada) de tu módulo. Se utilizan para exponer funcionalidad de manera controlada hacia **otros módulos** dentro del mismo backend. En lugar de que un módulo B importe comandos directamente del módulo A, el módulo B inyecta este servicio.
Por lo general, estos servicios inyectan el `CommandBus` y `QueryBus` (o los repositorios de solo lectura) para despachar la ejecución y devolver resultados, manteniendo el desacoplamiento.

**Ejemplo: `application/services/inventory.service.ts`**
```typescript
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateProductCommand } from '../product/commands/create-product/create-product.command';
import { ProductDto } from '../dtos/product.dto';

export class InventoryService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Método expuesto para ser usado por otro módulo, por ejemplo, "Ventas" (SalesModule)
   */
  async createProductInternally(product_dto: ProductDto): Promise<void> {
    const command = new CreateProductCommand(product_dto);
    return this.commandBus.execute(command);
  }
}
```
---

## 4. Capa de Infraestructura (`infrastructure`)

Aquí reside todo lo relacionado con tecnologías externas: frameworks, bases de datos, APIs externas, controladores HTTP, etc. Es la capa más externa de la Arquitectura Hexagonal.

### Estructura:
*(Nota: No todos los módulos requieren de todos estos directorios; utiliza solo los necesarios en tu módulo).*
```text
infrastructure/
├── cache/               # Estrategias y lógica de caché (Redis, en memoria, etc.)
├── config/              # Configuraciones específicas del módulo
├── controllers/         # Endpoints HTTP (REST/GraphQL)
├── decorators/          # Decoradores personalizados (ej. @User(), @Roles())
├── dtos/                # DTOs de validación de entrada (class-validator)
├── guards/              # Guardianes de autorización o validación de tokens
├── implementation/      # Implementación real de los repositorios (TypeORM, Prisma, etc.)
├── interceptors/        # Interceptores para transformar respuestas o registrar logs
├── interfaces/          # Interfaces propias de infraestructura (ej. tipados de librerías de 3ros)
├── queues/              # Productores y consumidores de colas (RabbitMQ, Kafka, SQS)
├── services/            # Servicios externos (Ej: llamadas a APIs, SDKs externos, S3)
├── utils/               # Funciones utilitarias exclusivas de la infraestructura
└── views/               # Plantillas para renderizado (ej. correos electrónicos)
```

### 4.1. Configuración de Servicios (`infrastructure/config`)
Dado que en la capa de Aplicación **está prohibido utilizar decoradores del framework** (como `@Injectable()`) para mantener la pureza de la Arquitectura Hexagonal, registramos y proveemos estos servicios a NestJS manualmente en la infraestructura. Para ello, utilizamos el utilitario `registerService`.

**Ejemplo: `infrastructure/config/services.config.ts`**
```typescript
import { Type, Abstract } from '@nestjs/common';
import { InventoryService } from '../../application/services/inventory.service';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { registerService } from '@/shared/infrastructure/factories/register-service.factory';

export const services: Array<{
  service: Type<unknown>;
  deps: Array<Type<unknown> | Abstract<unknown>>;
}> = [
  {
    service: InventoryService,
    deps: [CommandBus, QueryBus], // Dependencias que inyectará el constructor
  },
];

export const serviceProviders = services.map((uc) => registerService(uc.service, uc.deps));
```
*(Nota: `serviceProviders` se exporta para inyectarlo en el arreglo `providers` del Módulo principal).*

### 4.2. Controladores (`infrastructure/controllers`)
Reciben la petición HTTP, validan la entrada a través de pipes, documentan la API (Swagger), protegen la ruta (Auth/Permissions) y despachan el Command o Query correspondiente.

**Decoradores más utilizados en la plantilla:**
- `@Controller('path')`: Define el prefijo de la ruta.
- `@ApiBearerAuth('JWT-auth')`: Habilita la autenticación por token en la documentación de Swagger.
- `@Permissions('permiso-1', 'permiso-2')`: **(Crucial)** Decorador personalizado de la plantilla (`src/modules/security/infrastructure/decorators/permissions.decorator.ts`) para proteger el endpoint verificando que el usuario logueado tenga los permisos necesarios en su token.
- `@HttpCode(Status)`: Fuerza un código HTTP de respuesta explícito (ej: 200 OK, 201 Created).
- `@ApiParam()` / `@ApiQuery()`: Documenta explícitamente los parámetros de ruta o *query strings* para Swagger.
- Métodos HTTP estándar: `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`.

**Ejemplo completo (CRUD): `infrastructure/controllers/product.controller.ts`**
```typescript
import { Controller, Post, Get, Put, Patch, Body, Param, Query, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

import { Permissions } from '@/modules/security/infrastructure/decorators/permissions.decorator';
import { SuccessResponseDto } from '@/shared/infrastructure/dtos/success-response.dto';
import { HttpPaginatedResponseDto } from '@/shared/infrastructure/dtos/http-paginated-response.dto';
import { Pagination } from '@/shared/domain/value-object/pagination';

import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { ProductHttpDto } from '../dtos/product-http.dto';
import { GetProductsQueryDto } from '../dtos/query/get-products-query.dto';

import { CreateProductCommand } from '../../application/product/commands/create-product/create-product.command';
import { UpdateProductCommand } from '../../application/product/commands/update-product/update-product.command';
import { DeleteProductCommand } from '../../application/product/commands/delete-product/delete-product.command';
import { GetProductsQuery } from '../../application/product/queries/get-products/get-products.query';
import { GetProductQuery } from '../../application/product/queries/get-product/get-product.query';
import { ProductDto } from '../../application/dtos/product.dto';

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
  async create(
    @Body() dto: CreateProductDto,
  ): Promise<SuccessResponseDto<null>> {
    // Convertimos de HTTP DTO a App DTO y despachamos
    const appDto = CreateProductDto.toApplicationDto(dto);
    const command = new CreateProductCommand(appDto);
    await this.commandBus.execute(command);
    
    return new SuccessResponseDto<null>(null, HttpStatus.CREATED, 'Product created successfully');
  }

  @Permissions('editar-producto')
  @Put(':id')
  @HttpCode(200)
  @ApiParam({ name: 'id', required: true, type: String })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<SuccessResponseDto<null>> {
    const appDto = UpdateProductDto.toApplicationDto(dto);
    const command = new UpdateProductCommand({ id, ...appDto });
    await this.commandBus.execute(command);
    
    return new SuccessResponseDto<null>(null, HttpStatus.OK, 'Product updated successfully');
  }

  @Permissions('listar-productos')
  @Get()
  @HttpCode(200)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'filter_name', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: Boolean })
  async getAll(
    @Query() query: GetProductsQueryDto,
  ): Promise<SuccessResponseDto<HttpPaginatedResponseDto<ProductHttpDto>>> {
    const appQuery = new GetProductsQuery(query, query.filter_name, query.status);
    const result = await this.queryBus.execute(appQuery);

    const items = result instanceof Pagination ? result.getEntityList() : result;
    const totalItems = result instanceof Pagination ? result.getTotalItems() : items.length;
    const totalPages = result instanceof Pagination ? result.getTotalPages() : 1;

    // Transformamos la respuesta de aplicación a DTO de Infraestructura
    const productsHttpDto = items.map((p: ProductDto) => ProductHttpDto.fromDto(p));
    
    const response = new HttpPaginatedResponseDto<ProductHttpDto>(
      productsHttpDto, totalItems, totalPages, query.page, query.per_page
    );

    return new SuccessResponseDto<HttpPaginatedResponseDto<ProductHttpDto>>(
      response, HttpStatus.OK, 'Products retrieved successfully'
    );
  }

  @Permissions('ver-producto')
  @Get(':id')
  @HttpCode(200)
  @ApiParam({ name: 'id', required: true, type: String })
  async getOneById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponseDto<ProductHttpDto>> {
    const query = new GetProductQuery(id);
    const product: ProductDto = await this.queryBus.execute(query);
    
    // La excepción de no encontrado se maneja en el Handler (Capa de Aplicación)
    const productHttpDto = ProductHttpDto.fromDto(product);
    
    return new SuccessResponseDto<ProductHttpDto>(
      productHttpDto, HttpStatus.OK, 'Product retrieved successfully'
    );
  }

  @Permissions('eliminar-producto')
  @Patch(':id') // A menudo se usa Patch para Soft Delete (Toggle Status)
  @HttpCode(200)
  @ApiParam({ name: 'id', required: true, type: String })
  async toggleStatus(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponseDto<null>> {
    const command = new DeleteProductCommand(id);
    const product = await this.commandBus.execute(command);
    
    return new SuccessResponseDto<null>(
      null, HttpStatus.OK, `Product status updated to ${product.active ? 'active' : 'inactive'}`
    );
  }
}
```

### 4.3. DTOs de Infraestructura (`infrastructure/dtos`)
En esta capa existen dos grandes categorías de DTOs, cada uno con una responsabilidad muy específica:

#### 4.3.1. DTOs Validadores (Peticiones Entrantes - `validators`)
Estos DTOs se utilizan en los controladores para las peticiones HTTP que traen un cuerpo (POST, PUT, PATCH). Su única responsabilidad es **sanitizar, validar y documentar** la entrada que provee el cliente. 
Aquí es donde utilizamos exclusivamente librerías del marco web como `class-validator` y `@nestjs/swagger`. 
Convención de nombres: **`Create[Entidad]Dto`**, **`Update[Entidad]Dto`**.

**Ejemplo: `infrastructure/dtos/validators/product/create-product.dto.ts`**
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @ApiProperty({ example: 'Smartphone X' })
  name!: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 100 })
  stock!: number;

  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 999.99 })
  price!: number;
}
```

#### 4.3.2. DTOs HTTP (Respuestas Salientes - `http`)
Estos DTOs se utilizan para mapear las respuestas de la aplicación hacia el cliente HTTP. **No contienen decoradores de validación** (los datos salientes son confiables porque vienen del core). Sirven como un puente para transformar objetos de la capa de aplicación en JSON limpios, incluyendo a menudo métodos de fábrica.
Convención de nombres: **`[Entidad]HttpDto`**.

**Ejemplo: `infrastructure/dtos/http/product-http-dto/product-http.dto.ts`**
```typescript
import { ProductDto } from '../../../../application/dtos/product.dto';

export class ProductHttpDto {
  public readonly id: string;
  public readonly name: string;
  public readonly stock: number;
  public readonly price: number;

  constructor(id: string, name: string, stock: number, price: number) {
    this.id = id;
    this.name = name;
    this.stock = stock;
    this.price = price;
  }

  // Método de fábrica para mapear desde el DTO de Aplicación al DTO HTTP
  public static fromDto(dto: ProductDto): ProductHttpDto {
    return new ProductHttpDto(
      dto.id!,
      dto.name,
      dto.stock,
      dto.price
    );
  }
}
```

#### 4.3.3. DTOs de Query (Peticiones GET - `query`)
Utilizados específicamente para las consultas HTTP (endpoints `GET` o análogos) que reciben parámetros por cadena de consulta (query strings) como paginación o filtros dinámicos. 

En lugar de reescribir propiedades comunes en cada módulo, estos DTOs se componen de forma muy limpia y modular utilizando la utilidad `IntersectionType` de `@nestjs/swagger`. Esto permite heredar y combinar DTOs base predefinidos en el módulo compartido (`src/shared/application/dtos/...`).
Convención de nombres: **`Get[Entidades]QueryDto`**.

**Ejemplo: `infrastructure/dtos/query/get-products-query.dto.ts`**
```typescript
import { IntersectionType } from '@nestjs/swagger';
import { PaginationParamsDto } from '@/shared/application/dtos/pagination.dto';
import { FilterNameDto, StatusBooleanFilterDto } from '@/shared/application/dtos/filters';

// Combina paginación, filtro de nombre y filtro de estado booleano
export class GetProductsQueryDto extends IntersectionType(
  PaginationParamsDto,
  FilterNameDto,
  StatusBooleanFilterDto,
) {}
```

### 4.4. Implementación de Repositorios - Adaptadores (`infrastructure/implementation`)
Aquí se conecta la interfaz (Puerto) del dominio o de la aplicación con la tecnología real de persistencia (ej. Prisma). 
En esta plantilla, el Repositorio de Infraestructura **implementa dos puertos simultáneamente**, logrando un patrón CQRS a nivel de interfaces pero centralizando la lógica de acceso a datos:
1. **El Puerto del Dominio** (ej. `CountryRepository`): Se utiliza en los *Commands* (mutaciones). Recibe y devuelve **Entidades de Dominio completas**.
2. **El Puerto de Aplicación** (ej. `CountryQueriesRepository`): Se utiliza en las *Queries* (consultas). Devuelve **DTOs de lectura** o paginaciones directas, saltándose la costosa hidratación del Dominio.

Además, aquí es obligatorio **envolver los errores del ORM** en excepciones personalizadas (`DatabaseException`) para no filtrar detalles técnicos a la capa de aplicación.

**Ejemplo: `infrastructure/implementation/country/impl-country.repository.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/persistence/prisma/prisma.service';

import { Country } from '../../../domain/entities/country';
import { CountryRepository } from '../../../domain/repositories/country-repository';
import { CountryQueriesRepository } from '../../../application/repositories/country-read.repository';
import { CountryDto } from '../../../application/dtos/country.dto';

import { Pagination } from '@/shared/domain/value-object/pagination';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { DatabaseException } from '@/shared/infrastructure/exceptions/database.exception';

@Injectable()
export class ImplCountryRepository implements CountryRepository, CountryQueriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ========================================================
  // IMPLEMENTACIÓN DEL PUERTO DE DOMINIO (COMMANDS)
  // ========================================================
  
  async create(country: Country): Promise<void> {
    try {
      await this.prisma.client.ctl_country.create({
        data: {
          // Extraemos el tipo primitivo de los Value Objects (.value()) para persistir en BD
          name: country.getName().value(),
          iso2: country.getIso2().value(),
          code: country.getCode().value(),
          phone_code: country.getPhoneCode().value(),
          abbreviation: country.getAbbreviation().value(),
          active: country.getActive().value(),
        },
      });
    } catch (error: unknown) {
      // Capturamos el error crudo de Prisma y lanzamos nuestra DatabaseException controlada
      throw new DatabaseException('Error creating country', 'create');
    }
  }

  // ========================================================
  // IMPLEMENTACIÓN DEL PUERTO DE APLICACIÓN (QUERIES)
  // ========================================================
  
  async getAll(
    pagination_params?: PaginationParams,
    filter?: string,
    active?: boolean,
  ): Promise<Pagination<CountryDto> | CountryDto[]> {
    try {
      const where = {
        name: { contains: filter, mode: 'insensitive' as const },
        active: active,
      };

      // Ejecutamos las consultas en paralelo para mayor rendimiento
      const [countriesDb, total] = await Promise.all([
        this.prisma.client.ctl_country.findMany({
          skip: pagination_params ? (pagination_params.getPage().value() - 1) * pagination_params.getPerPage().value() : undefined,
          take: pagination_params ? pagination_params.getPerPage().value() : undefined,
          where,
          orderBy: { name: 'asc' },
        }),
        this.prisma.client.ctl_country.count({ where }),
      ]);

      // Mapeamos los modelos de BD directamente a DTOs de lectura (Bypass del Dominio)
      const countries = countriesDb.map(db => this.mapReadModelToDto(db));

      // Si no hay paginación, retornamos el arreglo crudo (Hot-Path del Caché)
      if (!pagination_params) {
        return countries; 
      }

      // Si hay paginación, retornamos el objeto complejo Pagination<>
      return new Pagination<CountryDto>(/* ... inyección de parámetros ... */);
    } catch (error) {
      throw new DatabaseException('Error getting countries', 'getAll');
    }
  }

  // ========================================================
  // MÉTODOS DE MAPEO INTERNOS
  // ========================================================
  
  private mapReadModelToDto(dbModel: any): CountryDto {
    // Convierte el modelo de Prisma (ctl_country) a CountryDto de Aplicación
    return new CountryDto(/* ... */);
  }
}
```

### 4.4. Otros Elementos de Infraestructura

Dependiendo de la complejidad del módulo, la capa de infraestructura puede extenderse con los directorios mencionados en el árbol superior. Algunos de los más importantes son:
- **`services/`**: A diferencia de los de aplicación, estos servicios comunican el módulo con el *mundo exterior* (Ej: un `StripePaymentService`, un cliente HTTP para otra API, o un publicador de S3).
- **`queues/`**: Manejadores de eventos asíncronos en infraestructura, suscribiéndose a colas de mensajería. Si un evento encolado impacta al dominio, este consumidor mapeará el payload y despachará un *Command*.
- **`guards/`, `interceptors/`, `decorators/`**: Mecanismos puramente ligados a NestJS para interceptar peticiones, modificar respuestas o validar autorización.

---

## 5. El Módulo de NestJS (`<nombre-modulo>.module.ts`)

Finalmente, ensamblamos todo en el archivo central del módulo. Aquí es donde "enchufamos" los adaptadores (implementaciones reales) a los puertos (interfaces) mediante la inyección de dependencias de NestJS.

**Ejemplo: `inventory.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Controladores (Infraestructura)
import { ProductController } from './infrastructure/controllers/product.controller';

// Puertos y Adaptadores (Dominio / Infraestructura)
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository';
import { ImplProductRepository } from './infrastructure/implementation/impl-product.repository';

// Casos de uso (Aplicación)
import { CreateProductHandler } from './application/product/commands/create-product/create-product.handler';

// Si usas TypeORM: 
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { ProductEntity } from './infrastructure/implementation/entities/product.entity';

// Agrupamos handlers para mantener limpio el módulo
const CommandHandlers = [CreateProductHandler];
const QueryHandlers = []; 

@Module({
  imports: [
    CqrsModule,
    // TypeOrmModule.forFeature([ProductEntity]) 
  ],
  controllers: [ProductController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      // Aquí hacemos la Inversión de Dependencias (DIP): 
      // Cuando la capa de aplicación pida el puerto (Token 'PRODUCT_REPOSITORY'), 
      // NestJS entregará el adaptador (Clase 'ImplProductRepository')
      provide: PRODUCT_REPOSITORY,
      useClass: ImplProductRepository,
    },
  ],
  exports: [],
})
export class InventoryModule {}
```

---

## Resumen del Flujo de Ejecución (Ejemplo POST)

1. **(Infraestructura)** La Petición HTTP llega al endpoint del `ProductController`.
2. **(Infraestructura)** El body es validado y transformado en un `CreateProductDto`.
3. **(Infraestructura -> CQRS)** El controlador crea un `CreateProductCommand` y lo despacha vía `CommandBus`.
4. **(Aplicación)** El framework NestJS dirige el comando al `CreateProductHandler`.
5. **(Aplicación -> Dominio)** El handler instancia un agregado/entidad `Product` y puede ejecutar la lógica/reglas de negocio de la misma.
6. **(Aplicación -> Puerto de Dominio)** El handler llama a `ProductRepository.save(product)`.
7. **(Infraestructura -> BD)** La ejecución es recibida por la clase real `ImplProductRepository` (El Adaptador), que mapea la entidad al esquema de base de datos y la persiste en el motor correspondiente.

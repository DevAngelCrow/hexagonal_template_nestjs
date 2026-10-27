---
name: nestjs-cqrs-cache-handler
description: Use this skill when implementing or optimizing list queries with Redis cache, cache bypass for filters or pagination, and cache invalidation in Command Handlers within hexagonal_template_nestjs using CatalogCacheService and Keyv.
---

# Estrategia de Caché y CQRS en NestJS

Esta habilidad define el patrón estándar para el manejo de caché distribuido en Redis utilizando `CatalogCacheService` y Keyv en `hexagonal_template_nestjs`.

---

## 1. Regla de Oro del Caché en Consultas (Query Handlers)

Para balancear consistencia de datos y rendimiento:
1. **Consultas con Parámetros (Filtros / Paginación)**: **Eluden la caché (*Cache Bypass*)**. Se consultan siempre a la base de datos vía el repositorio de lectura (`*QueriesRepository`).
2. **Consultas Limpias (*Hot-Path*)**: Se recuperan de Redis o se computan y almacenan con TTL mediante `CatalogCacheService.fetch()`.
3. **Invalidación Oportuna**: Todo comando (*Command Handler*) que mute el estado de los datos (creación, edición, eliminación o toggle de estado) debe invalidar las claves de caché correspondientes.

---

## 2. Implementación del Query Handler de Listado

Ubicación: `src/modules/<modulo>/application/<entidad>/queries/get-<entidades>/get-<entidades>.handler.ts`

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
    // 1. Paginación: Bypass de caché
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

    // 2. Filtros dinámicos: Bypass de caché
    if (query.filter || query.active !== undefined) {
      return await this.repository.getAll(
        undefined,
        query.filter,
        query.active,
      );
    }

    // 3. Hot-Path (Sin parámetros): Buscar en caché Redis o persistir resultado
    return this.cache.fetch<ProductDto[]>(
      PRODUCTS_ALL_CACHE_KEY,
      PRODUCTS_ALL_TTL_SECONDS,
      async () => {
        const result = await this.repository.getAll(
          undefined,
          undefined,
          undefined,
        );
        return Array.isArray(result) ? result : result.getEntityList();
      },
    );
  }
}

// 4. Exportar llaves para permitir invalidación en los Commands
export const PRODUCTS_CACHE_KEYS = {
  ALL: PRODUCTS_ALL_CACHE_KEY,
} as const;
```

---

## 3. Invalidación en Command Handlers

En cada handler que mute registros (ej. `create-product.handler.ts`, `update-product.handler.ts`, `delete-product.handler.ts`), inyectar `CatalogCacheService` e invalidar la clave:

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CatalogCacheService } from '@/shared/infrastructure/cache/catalog-cache.service';
import { PRODUCTS_CACHE_KEYS } from '../../queries/get-products/get-products.handler';
import { ProductRepository } from '../../../domain/repositories/product.repository';
import { CreateProductCommand } from './create-product.command';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    private readonly repository: ProductRepository,
    private readonly cache: CatalogCacheService,
  ) {}

  async execute(command: CreateProductCommand): Promise<void> {
    // 1. Lógica de dominio y persistencia...
    // await this.repository.save(product);

    // 2. Invalidación explícita de la caché
    await this.cache.invalidate(PRODUCTS_CACHE_KEYS.ALL);
  }
}
```

---

## 4. Validación de la Implementación

1. Comprobar que `CatalogCacheService` esté disponible en el contexto del módulo o proveído desde `SharedModule`.
2. Ejecutar `npm run check` para asegurar tipado estricto.
3. Probar con Redis activo (`docker compose up -d`) para verificar que las peticiones repetidas a `GET /products` respondan desde la memoria sin consultar la base de datos.

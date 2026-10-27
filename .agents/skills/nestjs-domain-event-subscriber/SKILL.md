---
name: nestjs-domain-event-subscriber
description: Use this skill when creating domain events, recording them in AggregateRoot, publishing them via TransactionAwareEventPublisher (after-commit hooks), and implementing subscribers with BullMQ or AuditLogService in hexagonal_template_nestjs.
---

# Eventos de Dominio y Publicación Transaccional After-Commit

Esta habilidad guía la creación e integración de eventos de dominio desacoplados en `hexagonal_template_nestjs`, garantizando que ningún efecto secundario (envío de emails, auditorías o tareas de background) se dispare si una transacción de base de datos hace rollback.

---

## 1. Arquitectura del Flujo de Eventos

```text
Entidad (AggregateRoot.record)
       │
       ▼
Command Handler (entity.pullDomainEvents)
       │
       ▼
TransactionAwareEventPublisher
       │
  ¿Transacción activa?
       ├── SÍ: Retiene eventos en `afterCommitHooks`
       │         └── Tras commit exitoso en BD ──► Despacha a Suscriptores
       │         └── Si ocurre Rollback ─────────► Descarta eventos
       └── NO: Despacha inmediatamente
                   │
                   ▼
       @EventsHandler Subscriptores
       ├── Encolar job en BullMQ (Worker en segundo plano)
       ├── Registro en AuditLogService
       └── Invalidación en Redis
```

---

## 2. Paso a Paso de Implementación

### Paso 1: Definir el Evento de Dominio (`domain/events/`)

Todo evento debe extender de `DomainEvent` (`src/shared/domain/domain-event.ts`) y ser inmutable:

```typescript
// src/modules/<modulo>/domain/events/<entidad>-created.event.ts
import { DomainEvent } from '@/shared/domain/domain-event';

export class ProductCreatedDomainEvent extends DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly name: string,
    public readonly occurredOn: Date = new Date(),
  ) {
    super();
  }
}
```

### Paso 2: Acumular el Evento en la Raíz de Agregado

La entidad acumula el evento usando `this.record()`:

```typescript
// src/modules/<modulo>/domain/aggregates/product.ts
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import { ProductCreatedDomainEvent } from '../events/product-created.event';

export class Product extends AggregateRoot {
  // ... constructor y propiedades ...

  public static create(id: string, name: string): Product {
    const product = new Product(id, name, true);
    // Acumula el evento internamente
    product.record(new ProductCreatedDomainEvent(id, name));
    return product;
  }
}
```

### Paso 3: Extraer y Publicar en el Command Handler

El handler recupera los eventos y los entrega al publicador:

```typescript
// src/modules/<modulo>/application/<entidad>/commands/create-<entidad>/create-<entidad>.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateProductCommand } from './create-product.command';
import { Product } from '../../../domain/aggregates/product';
import { ProductRepository } from '../../../domain/repositories/product.repository';
import { EventPublisherPort } from '@/shared/application/ports/event-publisher.port';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    private readonly repository: ProductRepository,
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(command: CreateProductCommand): Promise<void> {
    const product = Product.create(command.dto.id, command.dto.name);

    // 1. Persistir
    await this.repository.save(product);

    // 2. Extraer eventos acumulados y despachar
    const events = product.pullDomainEvents();
    await this.eventPublisher.publish(events);
  }
}
```

### Paso 4: Crear el Suscriptor en Infraestructura (`infrastructure/subscribers/`)

Para desacoplar el caso de uso de efectos secundarios pesados, se crea un suscriptor decorado con `@EventsHandler`:

```typescript
// src/modules/<modulo>/infrastructure/subscribers/product-created.subscriber.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ProductCreatedDomainEvent } from '../../domain/events/product-created.event';
import { AuditLogService } from '@/modules/audit/application/services/audit-log.service';

@Injectable()
@EventsHandler(ProductCreatedDomainEvent)
export class ProductCreatedSubscriber implements IEventHandler<ProductCreatedDomainEvent> {
  private readonly logger = new Logger(ProductCreatedSubscriber.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    private readonly auditService: AuditLogService,
  ) {}

  async handle(event: ProductCreatedDomainEvent): Promise<void> {
    this.logger.log(`Processing domain event ProductCreated: ${event.aggregateId}`);

    // 1. Encolar job asíncrono para el Worker
    await this.notificationsQueue.add('send-creation-notification', {
      productId: event.aggregateId,
      name: event.name,
    });

    // 2. Registrar en auditoría de forma no bloqueante
    await this.auditService.recordAction({
      action: 'PRODUCT_CREATED',
      resource: 'Product',
      resourceId: event.aggregateId,
      details: { name: event.name },
    });
  }
}
```

### Paso 5: Registrar el Suscriptor en el Módulo

En `<modulo>.module.ts`:
```typescript
import { ProductCreatedSubscriber } from './infrastructure/subscribers/product-created.subscriber';

@Module({
  providers: [
    ProductCreatedSubscriber,
    // ... otros providers
  ],
})
export class ProductModule {}
```

---

## 3. Validación y Pruebas

1. **Prueba de Transacción**: Si una operación dentro de una transacción lanza error, verificar que `afterCommitHooks` descarte los eventos y la cola BullMQ no reciba ningún job.
2. **Ejecución de Pruebas**:
```bash
npm run check
npm test
```

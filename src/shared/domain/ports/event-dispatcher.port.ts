import { DomainEventLike } from '@/shared/domain/aggregate-root';

/**
 * Port que define el contrato para publicar eventos de dominio.
 * La implementación concreta vive en la capa de infraestructura.
 */
export abstract class EventDispatcherPort {
  abstract dispatch(events: DomainEventLike[]): Promise<void>;
}

import { DomainEvent } from './events/domain-event';
export { DomainEvent };

export type DomainEventLike = DomainEvent | object;

export abstract class AggregateRoot<E extends DomainEventLike = DomainEventLike> {
  #events: E[] = [];

  protected record(event: E): void {
    this.#events.push(event);
  }

  /**
   * Alias de compatibilidad con código existente que utiliza apply().
   */
  protected apply(event: E): void {
    this.record(event);
  }

  /**
   * Extrae atómicamente todos los eventos acumulados y limpia el buffer interno.
   */
  pullDomainEvents(): E[] {
    const events = [...this.#events];
    this.#events = [];
    return events;
  }

  /**
   * Consulta los eventos acumulados sin vaciar el buffer (compatibilidad).
   */
  getDomainEvents(): E[] {
    return [...this.#events];
  }

  /**
   * Limpia manualmente los eventos acumulados (compatibilidad).
   */
  clearDomainEvents(): void {
    this.#events = [];
  }
}

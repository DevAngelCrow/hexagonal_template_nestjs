import { Injectable } from '@nestjs/common';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';
import { EventPublisherPort } from '@/shared/application/ports/event-publisher.port';
import { DomainEventLike } from '@/shared/domain/aggregate-root';

/**
 * Adaptador de compatibilidad que redirige dispatch() a EventPublisherPort
 * (TransactionAwareEventPublisher), garantizando publicación after-commit.
 */
@Injectable()
export class NestEventDispatcherAdapter extends EventDispatcherPort {
  constructor(private readonly eventPublisher: EventPublisherPort) {
    super();
  }

  async dispatch(events: DomainEventLike[]): Promise<void> {
    await this.eventPublisher.publish(events as any);
  }
}

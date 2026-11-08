import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { EventPublisherPort } from '@/shared/application/ports/event-publisher.port';
import { DomainEvent, DomainEventLike } from '@/shared/domain/aggregate-root';
import { TransactionContextService } from '@/shared/infrastructure/services/transaction-context.service';

@Injectable()
export class TransactionAwareEventPublisher implements EventPublisherPort {
  private readonly logger = new Logger(TransactionAwareEventPublisher.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly transactionContext: TransactionContextService,
  ) {}

  async publish(events: DomainEventLike | DomainEventLike[]): Promise<void> {
    const eventList = Array.isArray(events) ? events : [events];
    if (eventList.length === 0) {
      return;
    }

    if (this.transactionContext.isInTransaction()) {
      this.logger.debug(
        `Transacción activa detectada. Encolando ${eventList.length} evento(s) para publicación after-commit.`,
      );
      this.transactionContext.addAfterCommitHook(async () => {
        await this.dispatchToBus(eventList);
      });
      return;
    }

    await this.dispatchToBus(eventList);
  }

  private async dispatchToBus(events: DomainEventLike[]): Promise<void> {
    for (const event of events) {
      const isRichEvent = event instanceof DomainEvent;
      const eventName = isRichEvent
        ? event.eventName
        : event.constructor?.name || 'DomainEvent';
      const eventId = isRichEvent ? event.eventId : 'legacy';
      try {
        this.logger.debug(`Publicando evento de dominio: ${eventName} [${eventId}]`);
        await this.eventBus.publish(event);
      } catch (error) {
        this.logger.error(
          `Error despachando evento de dominio ${eventName}: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }
}

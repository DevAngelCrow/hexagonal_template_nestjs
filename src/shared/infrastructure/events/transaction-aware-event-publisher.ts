import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { EventPublisherPort } from '@/shared/application/ports/event-publisher.port';
import { DomainEvent } from '@/shared/domain/events/domain-event';
import { TransactionContextService } from '@/shared/infrastructure/services/transaction-context.service';

@Injectable()
export class TransactionAwareEventPublisher implements EventPublisherPort {
  private readonly logger = new Logger(TransactionAwareEventPublisher.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly transactionContext: TransactionContextService,
  ) {}

  async publish(events: DomainEvent | DomainEvent[]): Promise<void> {
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

  private async dispatchToBus(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      try {
        const eventName = event.eventName || event.constructor?.name || 'DomainEvent';
        const eventId = event.eventId || 'legacy';
        this.logger.debug(`Publicando evento de dominio: ${eventName} [${eventId}]`);
        await this.eventBus.publish(event);
      } catch (error) {
        const eventName = event.eventName || event.constructor?.name || 'DomainEvent';
        this.logger.error(
          `Error despachando evento de dominio ${eventName}: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionAwareEventPublisher } from './transaction-aware-event-publisher';
import { DomainEvent } from '@/shared/domain/events/domain-event';
import { TransactionContextService } from '@/shared/infrastructure/services/transaction-context.service';
import { EventBus } from '@nestjs/cqrs';

class SampleEvent extends DomainEvent {
  constructor(aggregateId: string) {
    super(aggregateId);
  }
  get eventName(): string {
    return 'sample.event';
  }
}

describe('TransactionAwareEventPublisher', () => {
  let publisher: TransactionAwareEventPublisher;
  let eventBus: EventBus;
  let transactionContext: TransactionContextService;

  beforeEach(() => {
    eventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    } as unknown as EventBus;

    transactionContext = new TransactionContextService();
    publisher = new TransactionAwareEventPublisher(eventBus, transactionContext);
  });

  it('should publish immediately to EventBus when not inside a transaction', async () => {
    const event = new SampleEvent('agg-1');
    await publisher.publish(event);

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledWith(event);
  });

  it('should defer publishing until after-commit when inside a transaction', async () => {
    const event = new SampleEvent('agg-2');
    const afterCommitHooks: Array<() => Promise<void> | void> = [];
    const dummyClient = {} as any;

    await transactionContext.run(dummyClient, afterCommitHooks, async () => {
      await publisher.publish(event);

      // Must NOT be published yet
      expect(eventBus.publish).not.toHaveBeenCalled();
      expect(afterCommitHooks).toHaveLength(1);
    });

    // Still not called before the hook runs
    expect(eventBus.publish).not.toHaveBeenCalled();

    // Simulate successful transaction commit
    for (const hook of afterCommitHooks) {
      await hook();
    }

    // Now it should have been published
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledWith(event);
  });

  it('should discard events if transaction rolls back and afterCommit hooks are not invoked', async () => {
    const event = new SampleEvent('agg-3');
    const afterCommitHooks: Array<() => Promise<void> | void> = [];
    const dummyClient = {} as any;

    try {
      await transactionContext.run(dummyClient, afterCommitHooks, async () => {
        await publisher.publish(event);
        throw new Error('Database transaction rollback simulation');
      });
    } catch {
      // rollback handled
    }

    // The transaction rolled back: hooks are never executed
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});

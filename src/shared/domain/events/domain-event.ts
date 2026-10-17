import { randomUUID } from 'node:crypto';

export abstract class DomainEvent {
  readonly eventId: string = randomUUID();
  readonly occurredOn: Date = new Date();

  protected constructor(readonly aggregateId: string) {}

  abstract get eventName(): string;
}

import { DomainEvent } from '@/shared/domain/events/domain-event';

export abstract class EventPublisherPort {
  abstract publish(events: DomainEvent | DomainEvent[]): Promise<void>;
}

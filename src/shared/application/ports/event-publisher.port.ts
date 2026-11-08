import { DomainEventLike } from '@/shared/domain/aggregate-root';

export abstract class EventPublisherPort {
  abstract publish(events: DomainEventLike | DomainEventLike[]): Promise<void>;
}

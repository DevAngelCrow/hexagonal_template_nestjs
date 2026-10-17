import { describe, it, expect } from 'vitest';
import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from './events/domain-event';

class UserCreatedTestEvent extends DomainEvent {
  constructor(aggregateId: string, readonly email: string) {
    super(aggregateId);
  }
  get eventName(): string {
    return 'test.user.created';
  }
}

class TestUser extends AggregateRoot {
  constructor(readonly id: string, public email: string) {
    super();
  }

  static create(id: string, email: string): TestUser {
    const user = new TestUser(id, email);
    user.record(new UserCreatedTestEvent(id, email));
    return user;
  }
}

describe('AggregateRoot & DomainEvent', () => {
  it('should record domain events and pull them atomically', () => {
    const user = TestUser.create('123', 'test@example.com');

    expect(user.getDomainEvents()).toHaveLength(1);
    const event = user.getDomainEvents()[0] as UserCreatedTestEvent;
    expect(event.aggregateId).toBe('123');
    expect(event.email).toBe('test@example.com');
    expect(event.eventName).toBe('test.user.created');
    expect(event.eventId).toBeDefined();
    expect(event.occurredOn).toBeInstanceOf(Date);

    // pullDomainEvents must return events and clear internal buffer
    const pulled = user.pullDomainEvents();
    expect(pulled).toHaveLength(1);
    expect(user.getDomainEvents()).toHaveLength(0);
    expect(user.pullDomainEvents()).toHaveLength(0);
  });
});

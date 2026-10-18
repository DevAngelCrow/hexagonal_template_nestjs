import { DomainEvent } from '@/shared/domain/events/domain-event';

export class UserRegisteredDomainEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly userName: string,
    public readonly personId?: string,
  ) {
    super(userId);
  }

  get eventName(): string {
    return 'iam.user.registered';
  }
}

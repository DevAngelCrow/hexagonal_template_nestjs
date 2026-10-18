import { DomainEvent } from '@/shared/domain/events/domain-event';

export class UserPasswordResetDomainEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    super(userId);
  }

  get eventName(): string {
    return 'iam.user.password_reset';
  }
}

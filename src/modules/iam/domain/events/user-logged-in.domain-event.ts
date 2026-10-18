import { DomainEvent } from '@/shared/domain/events/domain-event';

export class UserLoggedInDomainEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly userName: string,
    public readonly ipAddress?: string | null,
    public readonly userAgent?: string | null,
  ) {
    super(userId);
  }

  get eventName(): string {
    return 'iam.user.logged_in';
  }
}

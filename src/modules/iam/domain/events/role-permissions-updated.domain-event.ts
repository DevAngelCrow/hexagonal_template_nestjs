import { DomainEvent } from '@/shared/domain/events/domain-event';

export class RolePermissionsUpdatedDomainEvent extends DomainEvent {
  constructor(
    public readonly roleId: string,
    public readonly roleName: string,
    public readonly permissionIds: string[],
  ) {
    super(roleId);
  }

  get eventName(): string {
    return 'iam.role.permissions_updated';
  }
}

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Optional } from '@nestjs/common';
import { UserLoggedInDomainEvent } from '@/modules/iam/domain/events/user-logged-in.domain-event';
import { UserPasswordResetDomainEvent } from '@/modules/iam/domain/events/user-password-reset.domain-event';
import { RolePermissionsUpdatedDomainEvent } from '@/modules/iam/domain/events/role-permissions-updated.domain-event';
import { AuditLogService } from '@/modules/audit/application/services/audit-log.service';
import { AuditAction } from '@/modules/audit/domain/enums/audit-action.enum';

@Injectable()
@EventsHandler(
  UserLoggedInDomainEvent,
  UserPasswordResetDomainEvent,
  RolePermissionsUpdatedDomainEvent,
)
export class AuditIamSubscriber
  implements
    IEventHandler<
      | UserLoggedInDomainEvent
      | UserPasswordResetDomainEvent
      | RolePermissionsUpdatedDomainEvent
    >
{
  constructor(
    @Optional()
    private readonly auditLogService?: AuditLogService,
  ) {}

  handle(
    event:
      | UserLoggedInDomainEvent
      | UserPasswordResetDomainEvent
      | RolePermissionsUpdatedDomainEvent,
  ): void {
    if (!this.auditLogService) return;

    if (event instanceof UserLoggedInDomainEvent) {
      this.auditLogService.log({
        action: AuditAction.LOGIN_SUCCESS,
        user_id: event.userId,
        user_name: event.userName,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        entity_type: 'User',
        entity_id: event.userId,
      });
    } else if (event instanceof UserPasswordResetDomainEvent) {
      this.auditLogService.log({
        action: AuditAction.PASSWORD_RESET_COMPLETED,
        user_id: event.userId,
        entity_type: 'User',
        entity_id: event.userId,
        metadata: { email: event.email },
      });
    } else if (event instanceof RolePermissionsUpdatedDomainEvent) {
      this.auditLogService.log({
        action: AuditAction.ROLE_UPDATED,
        entity_type: 'Role',
        entity_id: event.roleId,
        metadata: {
          roleName: event.roleName,
          permissionCount: event.permissionIds.length,
        },
      });
    }
  }
}

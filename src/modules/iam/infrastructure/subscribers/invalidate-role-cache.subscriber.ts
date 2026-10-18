import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger, Optional } from '@nestjs/common';
import { RolePermissionsUpdatedDomainEvent } from '../../domain/events/role-permissions-updated.domain-event';
import { CatalogCachePort } from '@/shared/application/ports/catalog-cache.port';

@EventsHandler(RolePermissionsUpdatedDomainEvent)
export class InvalidateRoleCacheSubscriber
  implements IEventHandler<RolePermissionsUpdatedDomainEvent>
{
  private readonly logger = new Logger(InvalidateRoleCacheSubscriber.name);

  constructor(
    @Optional()
    private readonly cacheService?: CatalogCachePort,
  ) {}

  async handle(event: RolePermissionsUpdatedDomainEvent): Promise<void> {
    this.logger.log(
      `Invalidando cache de permisos para el rol ${event.roleName} (${event.roleId})`,
    );

    if (!this.cacheService) {
      return;
    }

    try {
      await this.cacheService.invalidate(`role_permissions:${event.roleId}`);
      await this.cacheService.invalidate(`role_permissions:${event.roleName}`);
    } catch (error) {
      this.logger.warn(
        `Error al invalidar cache de permisos del rol ${event.roleName}: ${(error as Error).message}`,
      );
    }
  }
}

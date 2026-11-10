import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger, Optional } from '@nestjs/common';
import { RouteCreatedEvent } from '@/modules/iam/domain/events/route-created.event';
import { RouteUpdatedEvent } from '@/modules/iam/domain/events/route-updated.event';
import { RouteStatusToggledEvent } from '@/modules/iam/domain/events/route-status-toggled.event';
import { CachePort } from '@/modules/iam/domain/ports/cache.port';

type RouteLifecycleEvent =
  RouteCreatedEvent | RouteUpdatedEvent | RouteStatusToggledEvent;

@EventsHandler(RouteCreatedEvent, RouteUpdatedEvent, RouteStatusToggledEvent)
export class InvalidateMenuCacheSubscriber implements IEventHandler<RouteLifecycleEvent> {
  private readonly logger = new Logger(InvalidateMenuCacheSubscriber.name);

  constructor(
    @Optional()
    private readonly cachePort?: CachePort,
  ) {}

  async handle(event: RouteLifecycleEvent): Promise<void> {
    this.logger.log(
      `Invalidando cache global de menú tras evento ${event.constructor.name}`,
    );

    if (!this.cachePort) {
      return;
    }

    try {
      await this.cachePort.invalidateAllMenus();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Error al invalidar cache global de menú: ${errorMessage}`,
      );
    }
  }
}

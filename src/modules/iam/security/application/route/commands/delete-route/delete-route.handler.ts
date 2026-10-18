import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RouteRepository } from '@/modules/security/domain/repositories/route-repository';
import { DeleteRouteCommand } from './delete-route.command';
import { RoutesId } from '@/modules/security/domain/value-objects/routes-value-object/routes-id';
import { RouteDto } from '../../../dtos/route.dto';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { RoutesActive } from '@/modules/security/domain/value-objects/routes-value-object/routes-active';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(DeleteRouteCommand)
export class DeleteRouteHandler implements ICommandHandler<DeleteRouteCommand> {
  constructor(
    private readonly repository: RouteRepository,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: DeleteRouteCommand): Promise<RouteDto> {
    const routeId = new RoutesId(command.id);
    const routeEntity = await this.repository.findById(routeId);
    if (!routeEntity) {
      throw new NotFoundException('Route', command.id);
    }

    routeEntity.toggleStatus(
      new RoutesActive(!routeEntity.getActive().value()),
    );

    await this.repository.update(routeEntity);
    await this.dispatcher.dispatch(routeEntity.getDomainEvents());
    routeEntity.clearDomainEvents();

    return RouteDto.fromEntity(routeEntity);
  }
}

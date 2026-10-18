import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RouteRepository } from '@/modules/security/domain/repositories/route-repository';
import { UpdateRouteCommand } from './update-route.command';
import { RoutesId } from '@/modules/security/domain/value-objects/routes-value-object/routes-id';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { BadRequestException } from '@/shared/domain/exceptions/bad-request.exception';
import { RoutesName } from '@/modules/security/domain/value-objects/routes-value-object/routes-name';
import { RoutesDescription } from '@/modules/security/domain/value-objects/routes-value-object/routes-description';
import { RoutesIcon } from '@/modules/security/domain/value-objects/routes-value-object/routes-icon';
import { RoutesUri } from '@/modules/security/domain/value-objects/routes-value-object/routes-uri';
import { RoutesShow } from '@/modules/security/domain/value-objects/routes-value-object/routes-show';
import { RoutesOrder } from '@/modules/security/domain/value-objects/routes-value-object/routes-order';
import { RoutesRquiredAuth } from '@/modules/security/domain/value-objects/routes-value-object/routes-require-auth';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(UpdateRouteCommand)
export class UpdateRouteHandler implements ICommandHandler<UpdateRouteCommand> {
  constructor(
    private readonly repository: RouteRepository,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: UpdateRouteCommand): Promise<void> {
    if (!command.route_dto.id) {
      throw new BadRequestException('El ID de la ruta es requerido para actualizar');
    }
    const routeEntity = await this.repository.findById(
      new RoutesId(command.route_dto.id),
    );
    if (!routeEntity) {
      throw new NotFoundException('Route', command.route_dto.id);
    }

    routeEntity.update(
      new RoutesName(command.route_dto.name),
      new RoutesDescription(command.route_dto.description),
      new RoutesIcon(command.route_dto.icon),
      new RoutesUri(command.route_dto.uri),
      new RoutesShow(command.route_dto.show),
      new RoutesOrder(command.route_dto.order),
      new RoutesRquiredAuth(command.route_dto.required_auth),
      command.route_dto.permissions_id,
    );

    await this.repository.update(routeEntity);
    await this.dispatcher.dispatch(routeEntity.getDomainEvents());
    routeEntity.clearDomainEvents();
  }
}

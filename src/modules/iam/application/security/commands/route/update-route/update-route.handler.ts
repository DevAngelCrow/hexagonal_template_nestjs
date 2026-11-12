import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RouteRepository } from '@/modules/iam/domain/repositories/route-repository';
import { UpdateRouteCommand } from '@/modules/iam/application/security/commands/route/update-route/update-route.command';
import { RoutesId } from '@/modules/iam/domain/value-objects/security/routes-value-object/routes-id';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { BadRequestException } from '@/shared/domain/exceptions/bad-request.exception';
import { RoutesName } from '@/modules/iam/domain/value-objects/security/routes-value-object/routes-name';
import { RoutesDescription } from '@/modules/iam/domain/value-objects/security/routes-value-object/routes-description';
import { RoutesIcon } from '@/modules/iam/domain/value-objects/security/routes-value-object/routes-icon';
import { RoutesUri } from '@/modules/iam/domain/value-objects/security/routes-value-object/routes-uri';
import { RoutesShow } from '@/modules/iam/domain/value-objects/security/routes-value-object/routes-show';
import { RoutesOrder } from '@/modules/iam/domain/value-objects/security/routes-value-object/routes-order';
import { RoutesRquiredAuth } from '@/modules/iam/domain/value-objects/security/routes-value-object/routes-require-auth';
import { RoutesTitle } from '@/modules/iam/domain/value-objects/security/routes-value-object/routes-title';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(UpdateRouteCommand)
export class UpdateRouteHandler implements ICommandHandler<UpdateRouteCommand> {
  constructor(
    private readonly repository: RouteRepository,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: UpdateRouteCommand): Promise<void> {
    if (!command.route_dto.id) {
      throw new BadRequestException(
        'El ID de la ruta es requerido para actualizar',
      );
    }
    if (
      command.route_dto.id_parent &&
      command.route_dto.id_parent === command.route_dto.id
    ) {
      throw new BadRequestException('Una ruta no puede ser su propio padre');
    }
    const routeEntity = await this.repository.findById(
      new RoutesId(command.route_dto.id),
    );
    if (!routeEntity) {
      throw new NotFoundException('Route', command.route_dto.id);
    }

    const resolvedTitle =
      command.route_dto.title ??
      routeEntity.getTitle()?.value() ??
      command.route_dto.name;

    routeEntity.update(
      new RoutesName(command.route_dto.name),
      new RoutesDescription(command.route_dto.description),
      new RoutesIcon(command.route_dto.icon),
      new RoutesUri(command.route_dto.uri),
      new RoutesShow(command.route_dto.show),
      new RoutesOrder(command.route_dto.order),
      new RoutesRquiredAuth(command.route_dto.required_auth),
      command.route_dto.permissions_id,
      new RoutesTitle(resolvedTitle),
      command.route_dto.id_parent
        ? new RoutesId(command.route_dto.id_parent)
        : undefined,
    );

    await this.repository.update(routeEntity);
    await this.dispatcher.dispatch(routeEntity.getDomainEvents());
    routeEntity.clearDomainEvents();
  }
}

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RouteRepository } from '@/modules/iam/domain/repositories/route-repository';
import { CreateRouteCommand } from '@/modules/iam/application/security/commands/route/create-route/create-route.command';
import { Route } from '@/modules/iam/domain/entities/route.entity';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(CreateRouteCommand)
export class CreateRouteHandler implements ICommandHandler<CreateRouteCommand> {
  constructor(
    private readonly repository: RouteRepository,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: CreateRouteCommand): Promise<void> {
    const routeEntity = Route.create({ ...command.route_dto });
    routeEntity.created();
    await this.repository.create(routeEntity);
    await this.dispatcher.dispatch(routeEntity.getDomainEvents());
    routeEntity.clearDomainEvents();
  }
}

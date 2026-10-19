import { RouteDto } from '@/modules/iam/application/security/dtos/route.dto';

export class UpdateRouteCommand {
  constructor(public readonly route_dto: RouteDto & { id: string }) {}
}

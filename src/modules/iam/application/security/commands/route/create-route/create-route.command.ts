import { RouteDto } from '@/modules/iam/application/security/dtos/route.dto';

export class CreateRouteCommand {
  constructor(public readonly route_dto: RouteDto) {}
}

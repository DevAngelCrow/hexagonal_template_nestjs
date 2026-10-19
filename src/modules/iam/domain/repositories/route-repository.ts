import { Route } from '@/modules/iam/domain/entities/route.entity';
import { RoutesId } from '@/modules/iam/domain/value-objects/security/routes-value-object/routes-id';

export abstract class RouteRepository {
  abstract create(route: Route): Promise<Route>;
  abstract update(route: Route): Promise<void>;
  abstract findById(id: RoutesId): Promise<Route | null>;
}

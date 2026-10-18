import { Route } from '../entities/route';
import { RoutesId } from '../value-objects/routes-value-object/routes-id';

export abstract class RouteRepository {
  abstract create(route: Route): Promise<Route>;
  abstract update(route: Route): Promise<void>;
  abstract findById(id: RoutesId): Promise<Route | null>;
}

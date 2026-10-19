import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SecurityAuthorizationPort } from '@/modules/iam/domain/ports/security-authorization.port';
import { FilterRoutesUserQuery } from '@/modules/iam/application/security/queries/authorization/filter-routes-user/queries/filter-routes-user.query';
import { Menu } from '@/modules/iam/domain/entities/menu.entity';

@QueryHandler(FilterRoutesUserQuery)
export class FilterRoutesUserHandler<
  T,
> implements IQueryHandler<FilterRoutesUserQuery> {
  constructor(
    private readonly securityAuthorizationPort: SecurityAuthorizationPort,
  ) {}
  async execute(query: FilterRoutesUserQuery): Promise<Menu<T>[]> {
    return await this.securityAuthorizationPort.filterRoutesForUser<T>(
      query.id_user,
    );
  }
}

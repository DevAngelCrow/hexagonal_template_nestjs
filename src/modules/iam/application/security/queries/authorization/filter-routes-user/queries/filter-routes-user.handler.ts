import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SecurityAuthorizationPort } from '@/modules/iam/domain/ports/security-authorization.port';
import { FilterRoutesUserQuery } from '@/modules/iam/application/security/queries/authorization/filter-routes-user/queries/filter-routes-user.query';
import { Menu, MenuNode } from '@/modules/iam/domain/entities/menu.entity';

@QueryHandler(FilterRoutesUserQuery)
export class FilterRoutesUserHandler implements IQueryHandler<FilterRoutesUserQuery> {
  constructor(
    private readonly securityAuthorizationPort: SecurityAuthorizationPort,
  ) {}
  async execute(query: FilterRoutesUserQuery): Promise<Menu<MenuNode>[]> {
    return await this.securityAuthorizationPort.filterRoutesForUser(
      query.id_user,
    );
  }
}

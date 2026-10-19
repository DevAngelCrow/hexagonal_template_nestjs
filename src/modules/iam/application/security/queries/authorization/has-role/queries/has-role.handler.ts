import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SecurityAuthorizationPort } from '@/modules/iam/domain/ports/security-authorization.port';
import { HasRoleQuery } from '@/modules/iam/application/security/queries/authorization/has-role/queries/has-role.query';

@QueryHandler(HasRoleQuery)
export class HasRoleHandler implements IQueryHandler<HasRoleQuery> {
  constructor(
    private readonly securityAuthorizationPort: SecurityAuthorizationPort,
  ) {}
  async execute(query: HasRoleQuery): Promise<boolean> {
    return await this.securityAuthorizationPort.hasRole(
      query.role,
      query.id_user,
    );
  }
}

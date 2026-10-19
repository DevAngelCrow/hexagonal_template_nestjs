import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SecurityAuthorizationPort } from '@/modules/iam/domain/ports/security-authorization.port';
import { CheckPermissionsQuery } from '@/modules/iam/application/security/queries/authorization/check-permissions/queries/check-permissions.query';

@QueryHandler(CheckPermissionsQuery)
export class CheckPermissionsHandler implements IQueryHandler<CheckPermissionsQuery> {
  constructor(
    private readonly securityAuthorizationPort: SecurityAuthorizationPort,
  ) {}
  async execute(query: CheckPermissionsQuery): Promise<boolean> {
    return await this.securityAuthorizationPort.checkPermission(
      query.permission,
      query.id_user,
    );
  }
}

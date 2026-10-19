import { PermissionsDto } from '@/modules/iam/application/security/dtos/permissions.dto';

export class CreatePermissionsCommand {
  constructor(public readonly permissions_dto: PermissionsDto) {}
}

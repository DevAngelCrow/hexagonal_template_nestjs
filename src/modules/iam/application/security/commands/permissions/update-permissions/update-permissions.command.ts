import { PermissionsDto } from '@/modules/iam/application/security/dtos/permissions.dto';

export class UpdatePermissionsCommand {
  constructor(public readonly permissions_dto: PermissionsDto) {}
}

import { RolDto } from '@/modules/iam/application/security/dtos/rol.dto';

export class CreateRolCommand {
  constructor(public readonly rol_dto: RolDto) {}
}

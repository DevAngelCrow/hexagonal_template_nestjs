import { RolDto } from '@/modules/iam/application/security/dtos/rol.dto';
import { GetRolByCodeHandler } from '@/modules/iam/application/security/queries/rol/get-rol-by-code/get-rol-by-code.handler';

export class GetRoleByCodeService {
  constructor(private readonly getRoleByCodeHandler: GetRolByCodeHandler) {}
  async run(code: string): Promise<RolDto | null> {
    const data = {
      code: code,
    };
    return await this.getRoleByCodeHandler.execute(data);
  }
}

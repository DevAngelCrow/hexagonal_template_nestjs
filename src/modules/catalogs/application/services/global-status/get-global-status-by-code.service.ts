import { GlobalStatusDto } from '@/modules/catalogs/application/dtos/global-status.dto';
import { GetGlobalStatusByCodeHandler } from '@/modules/catalogs/application/global-status/queries/get-global-status-by-code/get-global-status-by-code.handler';

export class GetGlobalStatusByCodeService {
  constructor(
    private readonly getGlobalStatusByCodeHandler: GetGlobalStatusByCodeHandler,
  ) {}
  async run(
    code: string,
    category_name: string,
  ): Promise<GlobalStatusDto | null> {
    const data = {
      code: code,
      category_name: category_name,
    };
    return await this.getGlobalStatusByCodeHandler.execute(data);
  }
}

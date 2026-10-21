import { Pagination } from '@/shared/domain/value-object/pagination';
import { MaritalStatusDto } from '@/modules/catalogs/application/dtos/marital-status.dto';
import { GetMaritalStatusesHandler } from '@/modules/catalogs/application/marital-status/queries/get-marital-statuses/get-marital-statuses.handler';
import { GetMaritalStatusesQuery } from '@/modules/catalogs/application/marital-status/queries/get-marital-statuses/get-marital-statuses.query';

export class GetMaritalStatusesService {
  constructor(
    private readonly getMaritalStatusesHandler: GetMaritalStatusesHandler,
  ) {}

  async run(
    query: GetMaritalStatusesQuery,
  ): Promise<Pagination<MaritalStatusDto> | MaritalStatusDto[]> {
    return await this.getMaritalStatusesHandler.execute(query);
  }
}

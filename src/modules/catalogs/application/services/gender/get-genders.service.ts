import { Pagination } from '@/shared/domain/value-object/pagination';
import { GenderDto } from '@/modules/catalogs/application/dtos/gender.dto';
import { GetGendersHandler } from '@/modules/catalogs/application/gender/queries/get-genders/get-genders.handler';
import { GetGendersQuery } from '@/modules/catalogs/application/gender/queries/get-genders/get-genders.query';

export class GetGendersService {
  constructor(private readonly getGendersHandler: GetGendersHandler) {}

  async run(
    query: GetGendersQuery,
  ): Promise<Pagination<GenderDto> | GenderDto[]> {
    return await this.getGendersHandler.execute(query);
  }
}

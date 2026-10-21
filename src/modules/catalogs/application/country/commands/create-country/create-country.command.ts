import { CountryDto } from '@/modules/catalogs/application/dtos/country.dto';

export class CreateCountryCommand {
  constructor(public readonly country_dto: CountryDto) {}
}

import { CountryDto } from '@/modules/catalogs/application/dtos/country.dto';

export class UpdateCountryCommand {
  constructor(public readonly country_dto: CountryDto) {}
}

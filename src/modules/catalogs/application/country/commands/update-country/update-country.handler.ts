import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Country } from '@/modules/catalogs/domain/entities/country';
import { UpdateCountryCommand } from './update-country.command';
import { CountryRepository } from '@/modules/catalogs/domain/repositories/country-repository';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { BadRequestException } from '@/shared/domain/exceptions/bad-request.exception';
import { CountryQueriesRepository } from '../../../repositories/country-read.repository';
import { CatalogCachePort } from '@/shared/application/ports/catalog-cache.port';
import { COUNTRIES_CACHE_KEYS } from '../../queries/get-countries/get-countries.handler';

@CommandHandler(UpdateCountryCommand)
export class UpdateCountryHandler implements ICommandHandler<UpdateCountryCommand> {
  constructor(
    private readonly repository: CountryRepository,
    private readonly readRepository: CountryQueriesRepository,
    private readonly cache: CatalogCachePort,
  ) {}
  async execute(command: UpdateCountryCommand): Promise<void> {
    const country = Country.create({ ...command.country_dto });
    const countryId = country.getId();
    if (!countryId) {
      throw new BadRequestException('Country id is required for update');
    }
    const foundCountry = await this.readRepository.getOneById(
      countryId.value(),
    );
    if (!foundCountry) {
      throw new NotFoundException('Country', countryId.value().toString());
    }
    await this.repository.update(country);
    await this.cache.invalidate(COUNTRIES_CACHE_KEYS.ALL);
  }
}

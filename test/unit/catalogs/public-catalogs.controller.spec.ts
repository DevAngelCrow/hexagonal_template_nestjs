import { describe, it, expect, vi } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CountryController } from '@/modules/catalogs/infrastructure/controllers/country.controller';
import { GeographicDivisionController } from '@/modules/catalogs/infrastructure/controllers/geographic-division.controller';
import { GetCountriesQuery } from '@/modules/catalogs/application/country/queries/get-countries/get-countries.query';
import { GetGeographicDivisionsQuery } from '@/modules/catalogs/application/geographic-division/queries/get-geographic-divisions/get-geographic-divisions.query';
import { GetGeographicDivisionsHandler } from '@/modules/catalogs/application/geographic-division/queries/get-geographic-divisions/get-geographic-divisions.handler';
import type { GeographicDivisionQueriesRepository } from '@/modules/catalogs/application/repositories/geographic-division-read.repository';
import { CountryDto } from '@/modules/catalogs/application/dtos/country.dto';
import { GeographicDivisionDto } from '@/modules/catalogs/application/dtos/geographic-division.dto';

const makeBuses = (queryResult: unknown) => {
  const commandBus = { execute: vi.fn() } as unknown as CommandBus;
  const queryBus = {
    execute: vi.fn().mockResolvedValue(queryResult),
  } as unknown as QueryBus;
  return { commandBus, queryBus };
};

describe('Public Catalogs (Country & GeographicDivision)', () => {
  it('CountryController.getPublic queries only active countries and returns mapped DTOs', async () => {
    const sampleCountries = [
      new CountryDto(
        'El Salvador',
        'SV',
        'SLV',
        'SV',
        '+503',
        true,
        '00000000-0000-4000-8000-000000000001',
        '9999-9999',
      ),
    ];
    const { commandBus, queryBus } = makeBuses(sampleCountries);
    const controller = new CountryController(commandBus, queryBus);

    const response = await controller.getPublic();

    expect(queryBus.execute).toHaveBeenCalledWith(
      new GetCountriesQuery(undefined, undefined, true),
    );
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.data).toHaveLength(1);
    expect(response.data[0].phone_mask).toBe('9999-9999');
  });

  it('GeographicDivisionController.getPublic forwards active=true, id_country, and level', async () => {
    const countryId = '00000000-0000-4000-8000-000000000001';
    const sampleDivisions = [
      new GeographicDivisionDto(
        'San Salvador',
        undefined,
        countryId,
        '00000000-0000-4000-8000-000000000002',
        true,
        undefined,
        '00000000-0000-4000-8000-000000000003',
      ),
    ];
    const { commandBus, queryBus } = makeBuses(sampleDivisions);
    const controller = new GeographicDivisionController(commandBus, queryBus);

    const response = await controller.getPublic({
      id_country: countryId,
      level: 1,
    });

    expect(queryBus.execute).toHaveBeenCalledWith(
      new GetGeographicDivisionsQuery(
        undefined,
        undefined,
        true,
        countryId,
        undefined,
        undefined,
        1,
      ),
    );
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe('San Salvador');
  });

  it('GetGeographicDivisionsHandler forwards optional level filter to repository.getAll', async () => {
    const getAll = vi.fn().mockResolvedValue([]);
    const repo = { getAll } as unknown as GeographicDivisionQueriesRepository;
    const handler = new GetGeographicDivisionsHandler(repo);

    await handler.execute(
      new GetGeographicDivisionsQuery(
        undefined,
        undefined,
        true,
        'country-uuid',
        undefined,
        undefined,
        2,
      ),
    );

    expect(getAll).toHaveBeenCalledWith(
      undefined,
      undefined,
      true,
      'country-uuid',
      undefined,
      undefined,
      2,
    );
  });
});

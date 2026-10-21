import { CountryQueriesRepository } from '@/modules/catalogs/application/repositories/country-read.repository';
import { GlobalStatusQueriesRepository } from '@/modules/catalogs/application/repositories/global-status-read.repository';
import { MaritalStatusQueriesRepository } from '@/modules/catalogs/application/repositories/marital-status-read.repository';
import { CountryRepository } from '@/modules/catalogs/domain/repositories/country-repository';
import { GlobalStatsusRepository } from '@/modules/catalogs/domain/repositories/global-status-repository';
import { MaritalStatusRepository } from '@/modules/catalogs/domain/repositories/marital-status-repository';
import { ImplCountryRepository } from '@/modules/catalogs/infrastructure/implementation/country/impl-country.repository';
import { ImplGlobalStatusRepository } from '@/modules/catalogs/infrastructure/implementation/global-status/impl-global-status.repository';
import { ImplMaritalStatusRepository } from '@/modules/catalogs/infrastructure/implementation/marital-status/impl-marital-status.repository';
import { GenderQueriesRepository } from '@/modules/catalogs/application/repositories/gender-read.repository';
import { ImplGenderRepository } from '@/modules/catalogs/infrastructure/implementation/gender/impl-gender.repository';
import { CategoryStatusRepository } from '@/modules/catalogs/domain/repositories/category-status-repository';
import { CategoryStatusQueriesRepository } from '@/modules/catalogs/application/repositories/category-status-read.repository';
import { ImplCategoryStatusRepository } from '@/modules/catalogs/infrastructure/implementation/category-status/impl-category-status.repository';
import { GeographicDivisionTypeRepository } from '@/modules/catalogs/domain/repositories/geographic-division-type-repository';
import { GeographicDivisionTypeQueriesRepository } from '@/modules/catalogs/application/repositories/geographic-division-type-read.repository';
import { ImplGeographicDivisionTypeRepository } from '@/modules/catalogs/infrastructure/implementation/geographic-division-type/impl-geographic-division-type.repository';
import { GeographicDivisionRepository } from '@/modules/catalogs/domain/repositories/geographic-division-repository';
import { GeographicDivisionQueriesRepository } from '@/modules/catalogs/application/repositories/geographic-division-read.repository';
import { ImplGeographicDivisionRepository } from '@/modules/catalogs/infrastructure/implementation/geographic-division/impl-geographic-division.repository';

export const repositories = [
  { provide: CountryRepository, useClass: ImplCountryRepository },
  { provide: CountryQueriesRepository, useClass: ImplCountryRepository },
  { provide: GlobalStatsusRepository, useClass: ImplGlobalStatusRepository },
  {
    provide: GlobalStatusQueriesRepository,
    useClass: ImplGlobalStatusRepository,
  },
  { provide: MaritalStatusRepository, useClass: ImplMaritalStatusRepository },
  {
    provide: MaritalStatusQueriesRepository,
    useClass: ImplMaritalStatusRepository,
  },
  {
    provide: GenderQueriesRepository,
    useClass: ImplGenderRepository,
  },
  { provide: CategoryStatusRepository, useClass: ImplCategoryStatusRepository },
  {
    provide: CategoryStatusQueriesRepository,
    useClass: ImplCategoryStatusRepository,
  },
  {
    provide: GeographicDivisionTypeRepository,
    useClass: ImplGeographicDivisionTypeRepository,
  },
  {
    provide: GeographicDivisionTypeQueriesRepository,
    useClass: ImplGeographicDivisionTypeRepository,
  },
  {
    provide: GeographicDivisionRepository,
    useClass: ImplGeographicDivisionRepository,
  },
  {
    provide: GeographicDivisionQueriesRepository,
    useClass: ImplGeographicDivisionRepository,
  },
];

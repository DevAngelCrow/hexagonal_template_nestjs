import { CreateCountryHandler } from '@/modules/catalogs/application/country/commands/create-country/create-country.handler';
import { UpdateCountryHandler } from '@/modules/catalogs/application/country/commands/update-country/update-country.handler';
import { DeleteCountryHandler } from '@/modules/catalogs/application/country/commands/delete-country/delete-country.handler';
import { CreateGlobalStatusHandler } from '@/modules/catalogs/application/global-status/commands/create-global-status/create-global-status.handler';
import { UpdateGlobalStatusHandler } from '@/modules/catalogs/application/global-status/commands/update-global-status/update-global-status.handler';
import { DeleteGlobalStatusHandler } from '@/modules/catalogs/application/global-status/commands/delete-global-status/delete-global-status.handler';
import { CreateMaritalStatusHandler } from '@/modules/catalogs/application/marital-status/commands/create-marital-status/create-marital-status.handler';
import { UpdateMaritalStatusHandler } from '@/modules/catalogs/application/marital-status/commands/update-marital-status/update-marital-status.handler';
import { DeleteMaritalStatusHandler } from '@/modules/catalogs/application/marital-status/commands/delete-marital-status/delete-marital-status.handler';
import { CreateCategoryStatusHandler } from '@/modules/catalogs/application/category-status/commands/create-category-status/create-category-status.handler';
import { UpdateCategoryStatusHandler } from '@/modules/catalogs/application/category-status/commands/update-category-status/update-category-status.handler';
import { DeleteCategoryStatusHandler } from '@/modules/catalogs/application/category-status/commands/delete-category-status/delete-category-status.handler';
import { CreateGeographicDivisionTypeHandler } from '@/modules/catalogs/application/geographic-division-type/commands/create-geographic-division-type/create-geographic-division-type.handler';
import { UpdateGeographicDivisionTypeHandler } from '@/modules/catalogs/application/geographic-division-type/commands/update-geographic-division-type/update-geographic-division-type.handler';
import { DeleteGeographicDivisionTypeHandler } from '@/modules/catalogs/application/geographic-division-type/commands/delete-geographic-division-type/delete-geographic-division-type.handler';
import { CreateGeographicDivisionHandler } from '@/modules/catalogs/application/geographic-division/commands/create-geographic-division/create-geographic-division.handler';
import { UpdateGeographicDivisionHandler } from '@/modules/catalogs/application/geographic-division/commands/update-geographic-division/update-geographic-division.handler';
import { DeleteGeographicDivisionHandler } from '@/modules/catalogs/application/geographic-division/commands/delete-geographic-division/delete-geographic-division.handler';

export const commandHandlerProviders = [
  CreateCountryHandler,
  UpdateCountryHandler,
  DeleteCountryHandler,
  CreateGlobalStatusHandler,
  UpdateGlobalStatusHandler,
  DeleteGlobalStatusHandler,
  CreateMaritalStatusHandler,
  UpdateMaritalStatusHandler,
  DeleteMaritalStatusHandler,
  CreateCategoryStatusHandler,
  UpdateCategoryStatusHandler,
  DeleteCategoryStatusHandler,
  CreateGeographicDivisionTypeHandler,
  UpdateGeographicDivisionTypeHandler,
  DeleteGeographicDivisionTypeHandler,
  CreateGeographicDivisionHandler,
  UpdateGeographicDivisionHandler,
  DeleteGeographicDivisionHandler,
];

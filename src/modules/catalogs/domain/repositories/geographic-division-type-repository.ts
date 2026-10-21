import { GeographicDivisionType } from '@/modules/catalogs/domain/entities/geographic-division-type';
import { GeographicDivisionTypeId } from '@/modules/catalogs/domain/value-objects/geographic-division-type-value-object/geographic-division-type-id';

export abstract class GeographicDivisionTypeRepository {
  abstract create(entity: GeographicDivisionType): Promise<void>;
  abstract update(entity: GeographicDivisionType): Promise<void>;
  abstract toggleStatus(
    id: GeographicDivisionTypeId,
  ): Promise<GeographicDivisionType>;
}

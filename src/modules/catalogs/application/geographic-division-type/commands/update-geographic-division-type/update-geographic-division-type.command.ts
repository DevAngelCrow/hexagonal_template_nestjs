import { GeographicDivisionTypeDto } from '@/modules/catalogs/application/dtos/geographic-division-type.dto';

export class UpdateGeographicDivisionTypeCommand {
  constructor(public readonly dto: GeographicDivisionTypeDto) {}
}

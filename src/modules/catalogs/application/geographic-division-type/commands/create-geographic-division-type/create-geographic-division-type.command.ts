import { GeographicDivisionTypeDto } from '@/modules/catalogs/application/dtos/geographic-division-type.dto';

export class CreateGeographicDivisionTypeCommand {
  constructor(public readonly dto: GeographicDivisionTypeDto) {}
}

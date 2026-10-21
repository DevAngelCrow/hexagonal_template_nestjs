import { GeographicDivisionDto } from '@/modules/catalogs/application/dtos/geographic-division.dto';

export class CreateGeographicDivisionCommand {
  constructor(public readonly dto: GeographicDivisionDto) {}
}

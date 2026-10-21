import { GeographicDivisionDto } from '@/modules/catalogs/application/dtos/geographic-division.dto';

export class UpdateGeographicDivisionCommand {
  constructor(public readonly dto: GeographicDivisionDto) {}
}

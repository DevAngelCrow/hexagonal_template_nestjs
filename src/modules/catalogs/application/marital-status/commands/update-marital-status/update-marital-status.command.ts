import { MaritalStatusDto } from '@/modules/catalogs/application/dtos/marital-status.dto';

export class UpdateMaritalStatusCommand {
  constructor(public readonly marital_status_dto: MaritalStatusDto) {}
}

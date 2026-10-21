import { MaritalStatusDto } from '@/modules/catalogs/application/dtos/marital-status.dto';

export class CreateMaritalStatusCommand {
  constructor(public readonly marital_status_dto: MaritalStatusDto) {}
}

import { GlobalStatusDto } from '@/modules/catalogs/application/dtos/global-status.dto';

export class CreateGlobalStatusCommand {
  constructor(public readonly global_status_dto: GlobalStatusDto) {}
}

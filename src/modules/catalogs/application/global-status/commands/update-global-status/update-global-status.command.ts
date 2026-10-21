import { GlobalStatusDto } from '@/modules/catalogs/application/dtos/global-status.dto';

export class UpdateGlobalStatusCommand {
  constructor(public readonly global_status_dto: GlobalStatusDto) {}
}

import { ProviderStorageDto } from '@/modules/storage/application/dtos/provider-storage.dto';

export class UpdateProviderStorageCommand {
  constructor(public readonly provider_storage_dto: ProviderStorageDto) {}
}
